# 골프왕부킹 DB 스키마 초안
_기준 스택: Supabase Postgres_

## 1. 설계 원칙
- MVP는 **정확도 높은 반수동 운영**을 우선한다.
- 골프장 정책은 **원문(raw text)** 과 **정규화(normalized fields)** 를 함께 저장한다.
- 사용자 입력 날짜 기준으로 예약 오픈 시점을 **계산형**으로 제공한다.
- 운영/검수/변경이력이 중요하므로 관리자용 메타데이터를 별도로 둔다.
- 초기에는 과도한 정규화보다 **운영이 쉬운 구조**를 우선한다.

---

## 2. 핵심 테이블 목록

### MVP 핵심
1. `golf_courses`
2. `booking_policies`
3. `source_records`
4. `change_logs`
5. `admin_profiles`
6. `user_reports`

### 선택 / 확장
7. `booking_channels`
8. `policy_snapshots`
9. `favorites`
10. `alert_subscriptions`
11. `computed_open_cache`

---

## 3. Enum 제안

### 3.1 `course_status`
- `active`
- `inactive`
- `seasonal_closed`
- `maintenance`

### 3.2 `verification_status`
- `draft`
- `verified`
- `needs_review`
- `hidden`

### 3.3 `policy_type`
- `days_before`
- `weekday_rule`
- `monthly_batch`
- `manual`
- `custom_formula`

### 3.4 `source_type`
- `manual`
- `homepage`
- `reservation_page`
- `notice_page`
- `phone_confirmed`
- `user_report`
- `crawler`

### 3.5 `report_status`
- `new`
- `reviewing`
- `resolved`
- `dismissed`

### 3.6 `admin_role`
- `owner`
- `admin`
- `editor`
- `viewer`

---

## 4. 테이블 상세

## 4.1 `golf_courses`
골프장 기본 정보.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK default gen_random_uuid() | 내부 골프장 ID |
| slug | text | unique not null | URL용 슬러그 |
| name | text | not null | 골프장명 |
| english_name | text | null | 영문명 |
| region_primary | text | not null | 시/도 |
| region_secondary | text | null | 시/군/구 또는 권역 |
| address | text | null | 주소 |
| latitude | numeric(10,7) | null | 위도 |
| longitude | numeric(10,7) | null | 경도 |
| phone | text | null | 대표전화 |
| homepage_url | text | null | 공식 홈페이지 |
| booking_url | text | null | 공식 예약 링크 |
| map_url | text | null | 지도 링크 |
| membership_required | boolean | default false | 회원권/회원자격 필요 여부 |
| membership_note | text | null | 회원제 관련 메모 |
| cancellation_policy_summary | text | null | 취소 정책 요약 |
| booking_note | text | null | 부킹 관련 메모 |
| status | text | not null default 'active' | 운영 상태 |
| verification_status | text | not null default 'draft' | 검수 상태 |
| last_verified_at | timestamptz | null | 최근 검증일 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |
| updated_by | uuid | null | 수정 관리자 |

### 제약 / 인덱스
- unique(`slug`)
- index on (`region_primary`)
- index on (`status`, `verification_status`)
- index on (`last_verified_at` desc)
- index on (`membership_required`)

### 비고
- `homepage_url`, `booking_url`, `map_url`는 앱 레벨에서 URL validation.
- `membership_required`는 MVP에선 boolean으로 두고, 고급 등급은 `membership_note`로 보완.

---

## 4.2 `booking_policies`
골프장 예약 오픈 규칙.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK default gen_random_uuid() | 정책 ID |
| golf_course_id | uuid | FK -> golf_courses(id) on delete cascade | 골프장 FK |
| policy_type | text | not null | 규칙 타입 |
| source_text | text | null | 사이트 원문 문구 |
| policy_summary | text | null | 사용자 노출용 요약 |
| days_before_open | integer | null | N일 전 오픈 규칙용 |
| open_weekday | smallint | null | 0~6 또는 1~7 요일 값 |
| open_time | time | null | 오픈 시간 |
| monthly_open_day | smallint | null | 월별 일괄 오픈 날짜 |
| monthly_offset_months | smallint | null | 익월/익익월 등 |
| rule_interpretation | text | null | 예: 다음 주차, 익월 전체 |
| manual_open_datetime | timestamptz | null | 수동 지정형 |
| formula_json | jsonb | null | 복합 규칙 구조 |
| effective_from | date | null | 적용 시작일 |
| effective_to | date | null | 적용 종료일 |
| is_active | boolean | not null default true | 현재 사용 여부 |
| last_verified_at | timestamptz | null | 최근 검증일 |
| confidence_score | numeric(3,2) | null | 0.00~1.00 |
| note | text | null | 운영자 메모 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |
| updated_by | uuid | null | 수정 관리자 |

### 제약 / 인덱스
- FK index on (`golf_course_id`)
- index on (`policy_type`, `is_active`)
- partial index on (`golf_course_id`) where `is_active = true`
- check: `confidence_score >= 0 and confidence_score <= 1`

### 비고
- 초기 MVP는 정책 1개만 active일 가능성이 높지만, 향후 시즌별 정책 변경을 위해 다중 row 허용.
- `formula_json` 예시:
```json
{
  "type": "weekday_rule",
  "open_weekday": 1,
  "open_time": "10:00",
  "target_logic": "three_weeks_before"
}
```

---

## 4.3 `source_records`
정책 출처 및 검증 근거 저장.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK default gen_random_uuid() | 출처 레코드 ID |
| golf_course_id | uuid | FK -> golf_courses(id) on delete cascade | 골프장 FK |
| booking_policy_id | uuid | FK -> booking_policies(id) on delete set null | 정책 FK |
| source_type | text | not null | 출처 유형 |
| source_url | text | null | 출처 링크 |
| source_title | text | null | 페이지 제목 |
| captured_text | text | null | 캡처한 원문 |
| screenshot_path | text | null | 저장 스크린샷 경로 |
| checked_at | timestamptz | not null default now() | 확인 일시 |
| checked_by | uuid | null | 확인 관리자 |
| is_current | boolean | not null default true | 현재 유효한 근거 여부 |
| note | text | null | 메모 |
| created_at | timestamptz | not null default now() | 생성일 |

### 인덱스
- index on (`golf_course_id`, `checked_at` desc)
- index on (`booking_policy_id`)
- index on (`source_type`)

### 비고
- MVP에서 매우 중요. 운영자가 “왜 이 정책을 믿는가”를 추적 가능해야 함.

---

## 4.4 `change_logs`
관리자 변경 이력.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK default gen_random_uuid() | 로그 ID |
| entity_type | text | not null | `golf_course`, `booking_policy`, `source_record` 등 |
| entity_id | uuid | not null | 대상 ID |
| action_type | text | not null | `create`, `update`, `delete`, `verify`, `hide` |
| changed_fields | jsonb | null | 변경 필드 |
| actor_id | uuid | null | 작업 관리자 |
| note | text | null | 메모 |
| created_at | timestamptz | not null default now() | 생성일 |

### 인덱스
- index on (`entity_type`, `entity_id`)
- index on (`actor_id`, `created_at` desc)

### 비고
- MVP는 앱 레벨에서 작성해도 충분.

---

## 4.5 `admin_profiles`
Supabase Auth 사용자와 연결되는 관리자 프로필.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | auth.users.id 와 동일 |
| email | text | unique not null | 이메일 |
| role | text | not null default 'viewer' | 관리자 역할 |
| display_name | text | null | 표시 이름 |
| is_active | boolean | not null default true | 활성 여부 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

### 비고
- RLS와 연결하기 쉬움.

---

## 4.6 `user_reports`
사용자 오류 제보.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK default gen_random_uuid() | 제보 ID |
| golf_course_id | uuid | FK -> golf_courses(id) on delete set null | 관련 골프장 |
| booking_policy_id | uuid | FK -> booking_policies(id) on delete set null | 관련 정책 |
| reporter_email | text | null | 제보자 이메일 |
| report_type | text | not null | `wrong_time`, `wrong_link`, `policy_changed`, `other` |
| message | text | not null | 제보 내용 |
| status | text | not null default 'new' | 처리 상태 |
| resolved_note | text | null | 처리 메모 |
| created_at | timestamptz | not null default now() | 생성일 |
| resolved_at | timestamptz | null | 처리일 |
| resolved_by | uuid | null | 처리 관리자 |

### 인덱스
- index on (`status`, `created_at` desc)
- index on (`golf_course_id`)

---

## 5. 계산형 스케줄 전략

## 5.1 기본 원칙
MVP는 `computed_open_cache` 없이도 동작 가능하다.
- 사용자 입력: 플레이 날짜
- 서버에서 active policy를 불러옴
- 각 골프장별 오픈일 계산
- 결과를 정렬/표시

## 5.2 확장 테이블: `computed_open_cache`
트래픽 증가 시 도입.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| golf_course_id | uuid | 골프장 |
| play_date | date | 희망 라운딩 날짜 |
| open_datetime | timestamptz | 계산된 예약 오픈일시 |
| status | text | 계산 결과 상태 |
| policy_version_hash | text | 정책 버전 해시 |
| computed_at | timestamptz | 계산 시각 |

### 인덱스
- unique(`golf_course_id`, `play_date`, `policy_version_hash`)
- index on (`open_datetime`)

### MVP 판단
- 초반에는 불필요.
- 1회 검색당 50~150개 계산이면 실시간 처리 충분.

---

## 6. 관계 요약
- `golf_courses` 1:N `booking_policies`
- `golf_courses` 1:N `source_records`
- `booking_policies` 1:N `source_records`
- `golf_courses` 1:N `user_reports`
- `admin_profiles` 1:N `change_logs`
- `admin_profiles` 1:N `source_records.checked_by`

---

## 7. MVP 우선 컬럼 vs 후순위 컬럼

### MVP 필수
- 골프장명
- 지역
- 주소(선택 가능)
- 링크 2~3개
- 회원권 필요 여부
- 정책 타입
- 정책 요약
- 오픈 계산 필드
- 최근 검증일
- 검수 상태

### 후순위
- 가격대
- 2인 가능 여부
- 캐디/카트 세부 정책
- 시즌별 상세 이력
- 사용자 즐겨찾기
- 알림 구독

---

## 8. RLS / 권한 초안

### 공개 읽기 허용
- `golf_courses`: `verification_status = 'verified'` AND `status = 'active'`
- `booking_policies`: `is_active = true` AND 연결 골프장이 공개 가능한 경우

### 관리자만 쓰기 허용
- `golf_courses`, `booking_policies`, `source_records`, `change_logs`

### 공개 쓰기 제한
- `user_reports`: insert만 허용 가능

---

## 9. 예시 쿼리

### 9.1 공개 가능한 골프장 + 활성 정책 조회
```sql
select
  gc.id,
  gc.name,
  gc.region_primary,
  gc.booking_url,
  gc.map_url,
  gc.membership_required,
  bp.policy_type,
  bp.policy_summary,
  bp.days_before_open,
  bp.open_weekday,
  bp.open_time,
  bp.manual_open_datetime
from golf_courses gc
join booking_policies bp on bp.golf_course_id = gc.id
where gc.status = 'active'
  and gc.verification_status = 'verified'
  and bp.is_active = true;
```

### 9.2 최근 검증 오래된 골프장 찾기
```sql
select *
from golf_courses
where last_verified_at is null
   or last_verified_at < now() - interval '30 days'
order by last_verified_at nulls first;
```

---

## 10. 추천 다음 단계
1. Supabase SQL migration 초안 작성
2. 정책 계산용 TypeScript 타입 정의
3. 관리자 CRUD 화면에 맞춘 폼 스키마(zod) 설계
4. 샘플 골프장 20개 직접 입력 후 필드 보정

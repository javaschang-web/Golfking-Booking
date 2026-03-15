# 골프왕부킹 초기 데이터 입력 스펙
_목적: MVP 초기 골프장 데이터를 일관되게 수집/입력/검수하기 위한 운영 기준_

## 1. 문서 목적
이 문서는 골프왕부킹 MVP에서 사용할 초기 골프장 데이터를
**어떤 항목으로, 어떤 형식으로, 어떤 기준으로** 입력할지 정의한다.

초기 목표는 전국 전체 자동화가 아니라,
**핵심 골프장 50~150개를 정확도 높게 수기/반수동으로 확보**하는 것이다.

---

## 2. 초기 데이터 운영 원칙

### 2.1 기본 원칙
- 공개적으로 확인 가능한 정보 위주로 수집한다.
- 정책은 반드시 **원문 + 정규화 값**을 함께 저장한다.
- 불확실하면 추측하지 않고 `검토 필요` 상태로 둔다.
- 링크는 직접 열어본 뒤 저장한다.
- 계산이 어려운 정책은 무리하게 구조화하지 않고 `manual` 타입으로 저장한다.

### 2.2 우선순위
초기 입력 대상은 아래 우선순위로 선정한다.

1. 수도권 인기 골프장
2. 강원 / 충청 주요 골프장
3. 정책이 비교적 명확한 골프장
4. 홈페이지/예약 링크가 안정적인 골프장
5. 정책 변경 빈도가 상대적으로 낮은 골프장

---

## 3. 수집 단위
초기 입력은 아래 3개 단위로 나눈다.

1. **골프장 기본 정보**
2. **예약 정책 정보**
3. **출처/검증 정보**

---

## 4. 필수 입력 항목

## 4.1 골프장 기본 정보

### 필수
- 골프장명 (`name`)
- 슬러그 (`slug`)
- 시/도 (`region_primary`)
- 예약 정책 존재 여부
- 공식 홈페이지 링크 또는 예약 링크 중 최소 1개
- 운영 상태 (`status`)
- 검수 상태 (`verification_status`)

### 권장
- 시/군/구 또는 권역 (`region_secondary`)
- 주소 (`address`)
- 대표전화 (`phone`)
- 지도 링크 (`map_url`)
- 위도 (`latitude`)
- 경도 (`longitude`)
- 회원권 필요 여부 (`membership_required`)
- 회원 관련 메모 (`membership_note`)
- 취소 정책 요약 (`cancellation_policy_summary`)
- 운영 메모 (`booking_note`)
- 최근 확인일 (`last_verified_at`)

---

## 4.2 예약 정책 정보
각 골프장은 최소 1개의 활성 정책이 있어야 한다.

### 필수
- 정책 타입 (`policy_type`)
- 정책 요약 (`policy_summary`)
- 정책 원문 (`source_text`)
- 활성 여부 (`is_active`)
- 최근 검증일 (`last_verified_at`)

### 정책 타입별 필수값

#### A. `days_before`
예: 이용일 21일 전 오전 10시 오픈
- `days_before_open`
- `open_time`

#### B. `weekday_rule`
예: 매주 월요일 오전 9시 다음 주 오픈
- `open_weekday`
- `open_time`
- `rule_interpretation`

#### C. `monthly_batch`
예: 매월 1일 오전 9시 익월 전체 오픈
- `monthly_open_day`
- `open_time`
- `monthly_offset_months`
- `rule_interpretation`

#### D. `manual`
예: 별도 공지 / 비정형 정책
- `manual_open_datetime` 또는
- `manual_rule_text`

### 권장
- `confidence_score`
- `note`
- `effective_from`
- `effective_to`

---

## 4.3 출처/검증 정보

### 필수
- 출처 유형 (`source_type`)
- 출처 URL (`source_url`) 또는 전화 확인 메모
- 확인 일시 (`checked_at`)
- 현재 유효 여부 (`is_current`)

### 권장
- 페이지 제목 (`source_title`)
- 캡처 원문 (`captured_text`)
- 스크린샷 경로 (`screenshot_path`)
- 확인자 (`checked_by`)
- 메모 (`note`)

---

## 5. 입력 포맷 기준

## 5.1 슬러그 규칙
- 영문 소문자 + 하이픈 사용
- 예: `seowon-hills`
- 공백 금지
- 중복 금지

## 5.2 시간 표기
- KST 기준
- `HH:MM` 24시간제 사용
- 예: `09:00`, `10:30`

## 5.3 날짜 표기
- `YYYY-MM-DD`
- datetime은 ISO 8601 권장
- 예: `2026-03-15T10:00:00+09:00`

## 5.4 지역 표기
### region_primary 예시
- 경기
- 강원
- 충북
- 충남
- 경북
- 경남
- 전북
- 전남
- 제주

### region_secondary 예시
- 경기 남부
- 경기 북부
- 용인
- 여주
- 춘천
- 원주

운영 초기에는 지나친 세분화보다
**사용자 검색에 의미 있는 수준**으로만 관리한다.

---

## 6. 입력 템플릿 예시

## 6.1 골프장 기본 정보 예시
```json
{
  "name": "서원힐스",
  "slug": "seowon-hills",
  "region_primary": "경기",
  "region_secondary": "파주",
  "address": "경기도 파주시 ...",
  "phone": "031-000-0000",
  "homepage_url": "https://example.com",
  "booking_url": "https://example.com/reservation",
  "map_url": "https://maps.google.com/...",
  "membership_required": false,
  "membership_note": "비회원 예약 가능",
  "cancellation_policy_summary": "예약일 기준 3일 전까지 취소 가능",
  "booking_note": "주말 예약 경쟁 높음",
  "status": "active",
  "verification_status": "verified"
}
```

## 6.2 예약 정책 예시
```json
{
  "policy_type": "days_before",
  "policy_summary": "이용일 21일 전 오전 10시 오픈",
  "source_text": "예약은 이용일 3주 전 오전 10시부터 가능합니다.",
  "days_before_open": 21,
  "open_time": "10:00",
  "is_active": true,
  "last_verified_at": "2026-03-15T09:00:00+09:00",
  "confidence_score": 0.95,
  "note": "홈페이지 공지 기준"
}
```

## 6.3 출처 정보 예시
```json
{
  "source_type": "homepage",
  "source_url": "https://example.com/booking-guide",
  "source_title": "예약 안내",
  "captured_text": "예약은 이용일 3주 전 오전 10시부터 가능합니다.",
  "checked_at": "2026-03-15T09:10:00+09:00",
  "is_current": true,
  "note": "운영자 직접 확인"
}
```

---

## 7. 검수 기준

## 7.1 검수 완료 조건
다음 조건을 만족하면 `verified` 처리 가능:
- 링크 최소 1개 이상 실제 동작 확인
- 정책 원문 확보
- 정책 타입 구조화 완료
- 오픈일 계산이 정상 동작하거나 manual 처리됨
- 최근 확인일 입력됨

## 7.2 `needs_review` 처리 기준
아래 조건이면 검토 필요:
- 정책 문구가 모호함
- 오픈 시간이 명시되지 않음
- 링크가 깨짐
- 회원/비회원 조건이 불분명함
- 시즌성/이벤트성 정책처럼 보임

## 7.3 `hidden` 처리 기준
- 실제 운영 종료
- 링크 완전 불능
- 정보 신뢰도 매우 낮음
- 법적/운영상 노출 보류 필요

---

## 8. 초기 입력 작업 방식 제안

## 8.1 작업 단위
운영자는 하루 단위로 아래 묶음 처리 권장:
- 골프장 10개 기본 정보 입력
- 정책 10개 구조화
- 검수 10개 완료

## 8.2 권장 순서
1. 골프장 기본 정보 입력
2. 링크 검증
3. 정책 원문 저장
4. 정책 정규화
5. 최근 확인일 입력
6. 검수 완료 처리

---

## 9. 초기 운영용 CSV 컬럼 제안
엑셀/CSV로 먼저 수집할 경우 아래 컬럼 사용 가능.

```csv
name,slug,region_primary,region_secondary,address,phone,homepage_url,booking_url,map_url,membership_required,membership_note,cancellation_policy_summary,booking_note,policy_type,policy_summary,source_text,days_before_open,open_weekday,open_time,monthly_open_day,monthly_offset_months,manual_open_datetime,rule_interpretation,source_type,source_url,last_verified_at,confidence_score,verification_status
```

---

## 10. 초기 골프장 선정 기준

### 우선 선정 대상
- 예약 규칙이 명확히 공개된 골프장
- 홈페이지 구조가 단순한 골프장
- 수도권/강원/충청 주요 골프장
- 사용자가 실제 자주 찾는 골프장

### 후순위
- 정책이 지나치게 비정형인 곳
- 로그인해야만 정보 확인 가능한 곳
- 공지/예약 체계가 자주 바뀌는 곳

---

## 11. 데이터 품질 체크리스트
각 골프장 등록 전 아래 체크:
- [ ] 골프장명 확인
- [ ] 슬러그 생성 완료
- [ ] 지역 지정 완료
- [ ] 링크 최소 1개 확인
- [ ] 정책 원문 저장
- [ ] 정책 타입 선택
- [ ] 시간/날짜 형식 검증
- [ ] 최근 확인일 입력
- [ ] 검수 상태 지정

---

## 12. 추천 다음 단계
1. 샘플 골프장 20개를 이 스펙으로 입력
2. 입력 후 필드 부족 여부 점검
3. 관리자 폼 UI를 이 스펙 기준으로 설계
4. CSV 업로드 지원 여부 판단

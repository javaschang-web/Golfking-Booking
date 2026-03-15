# 골프왕부킹 아키텍처 초안
_기준 스택: Next.js + Supabase + Vercel_

## 1. 아키텍처 목표
골프왕부킹 MVP의 목표는 다음 4가지를 만족하는 것이다.

1. 사용자가 **희망 라운딩 날짜 기준**으로 예약 오픈 시점을 빠르게 조회할 수 있어야 한다.
2. 운영자가 골프장 정책을 **쉽게 입력/수정/검수**할 수 있어야 한다.
3. 초기에는 **수동/반자동 운영 중심**으로 정확도를 확보해야 한다.
4. 추후 알림, 즐겨찾기, 자동 갱신 등으로 **확장 가능한 구조**여야 한다.

---

## 2. 시스템 개요

### 2.1 상위 구조
- **Frontend / BFF:** Next.js
- **DB / Auth / Storage:** Supabase
- **Hosting:** Vercel
- **관리 운영:** `/admin` 경로 + Supabase Auth
- **외부 링크:** 골프장 홈페이지, 예약 페이지, 지도 링크

### 2.2 핵심 철학
이 서비스는 예약 자동화 플랫폼이 아니라,
**예약 오픈 정보 탐색 서비스**다.

즉,
- 예약을 대신 수행하지 않고
- 공개 또는 검수된 정책 데이터를 기반으로
- 예약이 열리는 시점을 계산해 보여주는 구조로 설계한다.

---

## 3. 사용자 플로우

## 3.1 일반 사용자 플로우
1. 사용자가 희망 라운딩 날짜 입력
2. 지역 필터 선택
3. 서버가 활성 골프장 정책 조회
4. 예약 오픈 일시 계산
5. 리스트/캘린더 형태 결과 반환
6. 사용자가 공식 링크 / 예약 링크 / 지도 링크로 이동

## 3.2 관리자 플로우
1. 관리자 로그인
2. 골프장 신규 등록 또는 기존 데이터 수정
3. 정책 원문 + 구조화 규칙 입력
4. 출처 링크 및 검수일 저장
5. 검수 완료 후 공개 상태 반영

---

## 4. 프론트엔드 구조

## 4.1 추천 프레임워크
- **Next.js App Router**
- TypeScript
- Tailwind CSS
- 서버 컴포넌트 중심 + 필요한 부분만 클라이언트 컴포넌트

## 4.2 주요 라우트
- `/` : 홈/검색
- `/search` : 검색 결과
- `/courses/[slug]` : 골프장 상세
- `/admin` : 관리자 대시보드
- `/admin/courses` : 골프장 목록
- `/admin/courses/new` : 신규 등록
- `/admin/courses/[id]` : 수정
- `/admin/reports` : 사용자 제보 검토

## 4.3 프론트엔드 컴포넌트 구조 예시
- `DateSearchForm`
- `RegionFilter`
- `OpenScheduleList`
- `OpenScheduleCard`
- `CourseDetailPanel`
- `VerificationBadge`
- `AdminCourseForm`
- `PolicyFormSection`

## 4.4 렌더링 전략
### 공개 화면
- 서버 렌더링(SSR) 또는 서버 액션 기반 조회
- 검색 결과는 SEO보다 실용성이 중요하므로 SSR 우선

### 관리자 화면
- 인증 후 CSR/SSR 혼합 가능
- 폼 중심 인터랙션이 많으므로 클라이언트 컴포넌트 사용 비중 증가 가능

---

## 5. 백엔드 / BFF 구조

## 5.1 역할 분리
Next.js가 사실상 **BFF(Backend For Frontend)** 역할을 수행한다.

주요 역할:
- 사용자 검색 요청 수신
- Supabase에서 정책 데이터 조회
- 예약 오픈 계산 함수 실행
- 결과 포맷 변환 후 응답
- 관리자 폼 저장/검증 처리

## 5.2 추천 폴더 구조
```text
golfking-booking/
  app/
    page.tsx
    search/page.tsx
    courses/[slug]/page.tsx
    admin/
  components/
  lib/
    supabase/
    booking-rules/
    queries/
    validations/
    utils/
  types/
  docs/
  scripts/
```

## 5.3 서버 레이어 구성
- `lib/queries/` : Supabase 조회 함수
- `lib/booking-rules/` : 정책 계산 엔진
- `lib/validations/` : zod 스키마
- `lib/utils/` : 날짜/타임존 처리

---

## 6. 예약 오픈 계산 엔진

## 6.1 핵심 원리
입력값:
- 플레이 날짜
- 골프장별 정책

출력값:
- 예약 오픈 일시
- 계산 상태
- 정책 요약

## 6.2 지원해야 할 규칙 타입
1. `days_before`
   - 예: 플레이일 21일 전 10:00
2. `weekday_rule`
   - 예: 매주 월요일 09:00에 다음 주차 오픈
3. `monthly_batch`
   - 예: 매월 1일 09:00에 익월 전체 오픈
4. `manual`
   - 운영자가 지정한 오픈일시 사용

## 6.3 구현 원칙
- 타입별 함수 분리
- KST 기준 고정 계산
- 계산 실패 시 `needs_review` 상태 반환
- 결과에 반드시 근거 문구 포함

## 6.4 예시 함수 시그니처
```ts
type BookingPolicy = {
  policyType: 'days_before' | 'weekday_rule' | 'monthly_batch' | 'manual';
  daysBeforeOpen?: number;
  openWeekday?: number;
  openTime?: string;
  monthlyOpenDay?: number;
  manualOpenDatetime?: string;
};

function calculateOpenDatetime(playDate: string, policy: BookingPolicy): {
  status: 'ok' | 'needs_review' | 'unknown';
  openDatetime?: string;
  summary: string;
} {}
```

---

## 7. 데이터 입력 / 수집 전략

## 7.1 MVP 전략: 수동 우선
초기에는 자동 크롤링보다 **수동 입력 + 운영자 검수**가 우선이다.

이유:
- 법적 리스크 낮음
- 정확도 확보 쉬움
- 제품 적합성 검증이 빠름

## 7.2 2단계 전략: 반자동 보조
MVP 이후 가능한 구조:
- 공지 페이지 변경 감지
- 정책 문구 추출 후보 생성
- 운영자 승인 후 반영

즉,
**자동 반영이 아니라 자동 제안 + 수동 승인** 방식이 맞다.

## 7.3 데이터 수집 경계선
초기 서비스는 다음만 허용하는 방향 권장:
- 공개 페이지 정보
- 공식 링크 연결
- 운영자가 직접 검증한 정책

지양할 것:
- 로그인 후 페이지 무단 수집
- captcha 우회
- 자동 예약 시도
- 대규모 무차별 크롤링

---

## 8. Supabase 활용 구조

## 8.1 사용하는 기능
- **Postgres**: 핵심 데이터 저장
- **Auth**: 관리자 인증
- **Storage**: 스크린샷/출처 자료 저장(필요 시)
- **RLS**: 공개/관리자 접근 제어
- **Edge Functions**: 후속 자동 검증 배치나 간단한 웹훅 처리용

## 8.2 RLS 원칙
### 공개 읽기 허용
- 공개 상태의 골프장과 활성 정책만 읽기 가능

### 관리자만 쓰기 허용
- 골프장 생성/수정
- 정책 수정
- 출처/검수 상태 변경

### 공개 쓰기 제한 허용 가능
- 사용자 오류 제보 insert

---

## 9. Vercel 배포 구조

## 9.1 배포 대상
- Next.js 웹 앱 전체를 Vercel에 배포
- 환경 변수로 Supabase URL / anon key / service role key 분리

## 9.2 환경 변수 예시
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 9.3 배포 환경
- `preview` : PR 확인용
- `production` : 공개 서비스

---

## 10. 모니터링 / 분석

## 10.1 제품 분석
추천:
- Vercel Analytics 또는 PostHog

보고 싶은 지표:
- 날짜 검색 횟수
- 지역 필터 사용률
- 결과 클릭률
- 외부 링크 이동률
- 결과 없음 비율

## 10.2 에러 모니터링
추천:
- Sentry

대상:
- 계산 엔진 오류
- 관리자 저장 실패
- 외부 링크 누락 이슈
- 인증 문제

## 10.3 운영 모니터링
관리자 대시보드에서 보고 싶은 것:
- 최근 검증일 오래된 골프장 수
- 검수 미완료 골프장 수
- 계산 실패 정책 수
- 사용자 제보 미처리 수

---

## 11. 보안 구조

## 11.1 관리자 보호
- 관리자 경로 인증 필수
- role 기반 권한 분리
- 서비스 롤 키는 서버 전용

## 11.2 입력 검증
- zod 기반 서버 검증
- URL 필드 검증
- 텍스트 필드 XSS 방어

## 11.3 외부 링크 보안
- `target="_blank"`
- `rel="noopener noreferrer"`

## 11.4 공개 API 보호
- 검색 API rate limit 고려
- 무한 조회 방지용 basic throttling

---

## 12. 법적 / 운영 경계

## 12.1 서비스 포지셔닝
골프왕부킹은 아래 성격으로 고정하는 게 좋다.
- 예약 대행 아님
- 예약 성공 보장 아님
- 정보 탐색 서비스
- 공식 예약 채널로 연결해주는 서비스

## 12.2 필수 고지
- 정책은 변경될 수 있음
- 최신 정보는 공식 사이트 기준
- 외부 링크 정확성/가용성 보장하지 않음

## 12.3 운영 리스크
가장 큰 리스크:
- 데이터 오래됨
- 정책 변경 미반영
- 링크 깨짐

대응:
- 최근 확인일 표시
- 검수 상태 표시
- 사용자 제보 수집
- 운영자 점검 큐 구축

---

## 13. 단계별 진화 로드맵

## Phase 1: MVP
- 수동 입력 기반
- 검색 + 리스트 결과
- 관리자 CRUD
- 정책 계산 엔진
- 링크/지도 연결

## Phase 2: 운영 고도화
- 사용자 제보
- 검수 워크플로
- 반자동 수집 보조
- 캘린더 시각화 강화

## Phase 3: 개인화
- 로그인 사용자
- 즐겨찾기
- 알림 구독
- 관심 골프장 관리

## Phase 4: 데이터 플랫폼화
- 더 넓은 지역 커버리지
- 고급 필터
- B2B API/제휴 검토

---

## 14. 추천 개발 순서
1. Supabase 스키마 생성
2. 관리자 인증 + 골프장 CRUD
3. 정책 계산 유틸 작성
4. 검색 화면 + 결과 리스트 구현
5. 골프장 상세 페이지 구현
6. 샘플 데이터 20개 입력
7. 검수 상태 / 최근 확인일 UI 반영
8. 사용자 제보 기능 추가
9. 분석/모니터링 붙이기
10. 베타 공개

---

## 15. 권장 초기 저장소 구조
```text
golfking-booking/
  MVP_PRD.md
  DB_SCHEMA.md
  ARCHITECTURE.md
  app/
  components/
  lib/
    booking-rules/
    queries/
    supabase/
    validations/
  types/
  public/
  scripts/
  docs/
```

---

## 16. 한 줄 결론
골프왕부킹의 MVP 아키텍처는 복잡할 필요 없다.
핵심은 **Next.js + Supabase + 수동 검수 중심 데이터 운영 + 계산형 검색 결과**다.

초기 승부는 기술 난이도보다,
- 데이터 정확도
- 운영 편의성
- 검색 속도
- 공식 링크 연결 경험

이 4가지에 달려 있다.

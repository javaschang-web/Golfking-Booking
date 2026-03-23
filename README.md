# GolfKing Booking

골프장 예약 오픈 정보를 검색하고, 운영자가 골프장/정책/출처를 관리할 수 있는 MVP 프로젝트야.

## 현재 상태

### 공개 사용자 기능
- 홈 검색 화면 (`/`)
- 지역 + 플레이 날짜 기반 검색 (`/search`)
- 예약 오픈 계산 결과 표시
- 골프장 상세 페이지 (`/courses/[slug]`)

### 관리자 기능
- 관리자 로그인 (`/admin/login`)
- 관리자 대시보드 (`/admin`)
- 골프장 목록 조회 (`/admin/courses`)
- 골프장 신규 등록 (`/admin/courses/new`)
- 골프장 수정 (`/admin/courses/[id]`)
- 예약 정책 CRUD
- 출처/source 기록 관리
- 사용자 제보 목록 조회 (`/admin/reports`)

### 빌드 상태
- `npm run build` 성공 확인 완료

---

## 기술 스택
- Next.js 14 (App Router)
- React 18
- TypeScript
- Supabase

---

## 로컬 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.local` 파일 예시:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드 확인
```bash
npm run build
```

---

## 주요 폴더
- `app/` : App Router 페이지
- `components/` : UI 컴포넌트
- `lib/supabase/` : Supabase 클라이언트
- `lib/queries/` : DB 조회 함수
- `lib/booking-rules/` : 예약 오픈 계산 로직
- `migrations/` : Supabase SQL 마이그레이션

---

## DB / 마이그레이션
적용된 주요 마이그레이션:
- `001_init.sql`
- `002_seed_sample.sql`
- `003_rls_policies_safe.sql`
- `004_fix_user_reports_rls.sql`
- `005_link_admin_account_template.sql`

관리자 계정 연결은 `005_link_admin_account_template.sql` 템플릿을 기반으로 진행하면 돼.

---

## 운영 메모
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이야. 브라우저에 노출하면 안 돼.
- anon insert는 `user_reports`에서 `Prefer: return=minimal` 기준으로 성공 검증됨.
- 직접 DB 키를 노출한 적이 있으므로, 운영 전에는 키 rotate 상태를 다시 확인하는 게 좋아.

---

## 다음 권장 작업
- 관리자 인증 흐름 고도화(SSR/session 쿠키 기반)
- 검색 결과 UX 보강
- 계산 엔진 정밀도 향상
- 배포(Vercel + GitHub Actions) 연결

---

## 참고 문서
- `ARCHITECTURE.md`
- `DB_SCHEMA.md`
- `ROADMAP.md`
- `TASKS.md`
- `WORK_LOG.md`
- `SECURITY.md`
- `GITHUB_ACTIONS_README.md`
- `DEPLOY_CHECKLIST.md`
- `DEPLOY_STATUS.md`
- `BULK_INPUT_GUIDE.md`
- `VERCEL_ENV_TEMPLATE.md`
- `VERCEL_DEPLOY_PLAN.md`
- `POST_DEPLOY_CHECKS.md`
- `OPERATIONS.md`
- `ADMIN_SETUP.md`
- `RUNBOOK.md`
- `AUTH_UPGRADE_PLAN.md`

# GitHub Actions: build / deploy notes

현재 저장소에는 두 종류의 자동화 흐름이 준비돼 있어.

## 1. Build Check
파일:
- `.github/workflows/build-check.yml`

목적:
- main/master push 또는 PR에서 `npm run build`가 깨지지 않는지 확인

필요한 GitHub Secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 2. Supabase Migration/Deploy (문서 기준)
실제 DB 변경 자동화 시 필요한 시크릿:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## 권장 운영 방식
- 앱 빌드 검증은 `build-check.yml`로 먼저 보호
- DB 변경은 별도 workflow 또는 수동 승인 흐름으로 관리
- service role key는 노출 이력이 있으면 배포 전에 반드시 rotate

## 배포 후 확인
- `/api/health`
- `/`
- `/search?date=2026-04-30&region=경기`
- `/courses/seowon-hills?date=2026-04-30&region=경기`
- `/admin/login`

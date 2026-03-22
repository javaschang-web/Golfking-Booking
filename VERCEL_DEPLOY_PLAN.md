# VERCEL_DEPLOY_PLAN.md

## 배포 순서
1. GitHub 저장소 최신 반영
2. Vercel 프로젝트 생성/연결
3. Environment Variables 설정
4. Production Deploy 실행
5. 공개 홈/검색/상세/관리자 로그인 확인

## 필수 환경변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 1차 배포 후 확인할 경로
- `/`
- `/search?date=2026-04-30&region=경기`
- `/courses/seowon-hills?date=2026-04-30&region=경기`
- `/admin/login`

## 운영 전 권장
- service role key rotate 재확인
- 관리자 계정 로그인 재점검
- 샘플 데이터 노출 상태 재검토

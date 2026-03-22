# DEPLOY_CHECKLIST

## 배포 전 체크
- [ ] Supabase 프로젝트 URL 확인
- [ ] anon key 확인
- [ ] service role key rotate 상태 확인
- [ ] `admin_profiles` 관리자 계정 연결 여부 확인
- [ ] `npm run build` 성공 확인
- [ ] `.env.local`의 placeholder 값 제거 확인

## Vercel 환경변수
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

## GitHub Actions 시크릿
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`

## 운영 점검
- [ ] `/` 접속 확인
- [ ] `/search` 검색 확인
- [ ] `/courses/[slug]` 상세 확인
- [ ] `/admin/login` 로그인 확인
- [ ] `/admin/courses` 목록 확인
- [ ] `/api/health` 확인
- [ ] `user_reports` insert 확인

## 배포 후 권장
- [ ] 키 rotate 이력 기록
- [ ] 관리자 계정 최소 권한 재점검
- [ ] 최근 검수일 오래된 골프장 점검

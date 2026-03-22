# DEPLOY_STATUS.md

## 현재 준비 상태
- [x] `npm run build` 성공
- [x] dev 기준 핵심 경로 응답 확인
- [x] Vercel 환경변수 문서화
- [x] 배포 후 체크리스트 정리
- [x] 헬스체크 API(`/api/health`) 추가
- [x] GitHub Actions build-check 추가
- [ ] 실제 Vercel 환경변수 입력
- [ ] 실제 Vercel 배포 실행
- [ ] 배포 후 smoke test 수행

## 다음 바로 할 일
1. Vercel 환경변수 입력
2. Production 배포
3. `POST_DEPLOY_CHECKS.md` 순서대로 확인
4. `scripts/smoke-check.ps1` 로 1차 자동 점검

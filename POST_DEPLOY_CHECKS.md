# POST_DEPLOY_CHECKS

배포 직후 확인할 항목.

## 1. 기본 응답
- `/`
- `/search`
- `/api/health`

## 2. 대표 검색 시나리오
- `/search?date=2026-04-30&region=경기`
- 결과 카드 표시 확인
- 상세 이동 확인

## 3. 상세 시나리오
- `/courses/seowon-hills?date=2026-04-30&region=경기`
- 기본 정보 / 정책 / 출처 / 계산 결과 확인

## 4. 관리자 시나리오
- `/admin/login`
- 로그인 성공 여부
- `/admin/courses`
- `/admin/courses/new`
- `/admin/reports`

## 5. API 헬스체크
- `/api/health`
- 기대 응답 예시:
```json
{
  "ok": true,
  "service": "golfking-booking",
  "timestamp": "..."
}
```

## 6. 자동 스모크 테스트
PowerShell:
```powershell
./scripts/smoke-check.ps1 -BaseUrl https://your-app.vercel.app
```

## 7. 실패 시 우선 확인
- Vercel 환경변수 누락 여부
- Supabase URL / anon key / service role key 오타 여부
- 관리자 계정의 `admin_profiles` 연결 여부
- 최근 build log / function log

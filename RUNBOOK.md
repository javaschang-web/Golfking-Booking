# RUNBOOK.md

문제 발생 시 빠르게 보는 문서.

## 1. 검색이 안 보일 때
확인 순서:
1. `/search` 응답 확인
2. Supabase env 확인
3. `golf_courses`가 `active + verified`인지 확인
4. 연결된 `booking_policies.is_active = true`인지 확인

## 2. 관리자 로그인은 되는데 페이지 접근이 안 될 때
확인 순서:
1. Auth 계정 존재 여부
2. `admin_profiles.id = auth.users.id` 연결 여부
3. `admin_profiles.is_active = true` 여부
4. 브라우저 콘솔 에러 / 네트워크 확인

## 3. user_reports insert가 실패할 때
확인 순서:
1. RLS 정책 반영 여부
2. `Prefer: return=minimal` 기준 성공 여부
3. `report_type`, `message` 값 존재 여부

## 4. 정책 계산이 이상할 때
확인 순서:
1. `policy_type`
2. `open_time`
3. `days_before_open` / `open_weekday` / `monthly_open_day`
4. `rule_interpretation`
5. `policy-cases.md` 기준과 비교

## 5. 배포가 실패할 때
- `npm run build` 로컬 재확인
- env 누락 여부 확인
- Vercel 환경변수 / GitHub Actions Secrets 재확인

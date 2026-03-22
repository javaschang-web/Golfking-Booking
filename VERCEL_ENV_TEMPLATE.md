# VERCEL_ENV_TEMPLATE

Vercel Project Settings → Environment Variables 에 아래 값을 넣으면 돼.

## Production / Preview 공통
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 값 예시
- `NEXT_PUBLIC_SUPABASE_URL=https://uuvzjaqbvpolqhxkqjzw.supabase.co`
- `NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>`

## 주의
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 브라우저 코드에 직접 쓰면 안 됨.
- Preview / Production 환경을 분리할 수 있으면 분리 추천.
- 키 노출 이력이 있으면 배포 전에 반드시 rotate 후 반영.
- 배포 후 `/api/health`와 `/search`를 먼저 확인하는 것을 권장.

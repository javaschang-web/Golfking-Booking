# AUTH_UPGRADE_PLAN.md

## 목표
현재 클라이언트 중심 관리자 인증을, 이후 Next.js App Router + SSR/session 쿠키 기반 구조로 업그레이드하기 위한 계획.

## 현재 상태
- 로그인: `signInWithPassword`
- 관리자 접근 확인: 클라이언트에서 `admin_profiles` 조회
- 장점: 구현 빠름
- 한계: SSR 보호가 약하고, 초기 로딩 시 클라이언트 확인이 필요함

## 다음 업그레이드 방향
1. `@supabase/ssr` 도입
2. `middleware.ts`에서 세션 갱신 처리
3. 서버 컴포넌트에서 쿠키 기반 사용자 확인
4. `/admin/*`에 서버 가드 적용
5. 역할(role)별 분기 강화

## 적용 순서 제안
1. `@supabase/ssr` 설치
2. `lib/supabase/server.ts` / `middleware.ts` 재구성
3. `/admin` 보호 구조 전환
4. 기존 `AdminGate`는 최소화하거나 클라이언트 보조 레이어로만 사용

## 도입 전제
- 현재 MVP는 이미 빌드/동작 가능 상태
- 따라서 지금은 '운영 가능 MVP'를 유지한 채, 별도 브랜치/세션에서 안전하게 옮기는 것을 권장

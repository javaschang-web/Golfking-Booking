# ADMIN_SETUP.md

관리자 계정 연결 절차.

## 1. Supabase Auth에서 관리자 계정 생성
- 이메일/비밀번호 로그인용 계정 생성

## 2. auth.users.id 확인
- Supabase Auth 사용자 목록에서 해당 계정 UUID 확인

## 3. `admin_profiles` 연결
- `migrations/005_link_admin_account_template.sql` 열기
- 아래 값 바꾸기:
  - `REPLACE_WITH_AUTH_USER_UUID`
  - `REPLACE_WITH_ADMIN_EMAIL`
- SQL Editor에서 실행

## 4. 로그인 테스트
- `/admin/login` 접속
- 방금 생성한 계정으로 로그인
- `/admin` 진입 확인

## 5. 권한 모델
- `owner`: 최고 권한
- `admin`: 운영/관리 가능
- `editor`: 데이터 수정 중심
- `viewer`: 조회 중심 (현재 UI 분기 세분화 전)

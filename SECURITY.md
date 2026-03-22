# SECURITY.md - 키/시크릿 및 운영 보안 가이드

이 문서는 골프왕부킹 프로젝트의 민감정보(시크릿, DB 키 등) 관리와 긴급 대응 절차를 정리한다.

## 1. 핵심 원칙
- 민감정보는 절대 공개 저장소에 커밋하지 않는다.
- 서비스 롤 키(Service Role Key) 등은 서버 전용으로만 사용하고, 클라이언트(브라우저)에 절대 노출하지 않는다.
- 키는 최소 권한 원칙(least privilege)을 적용해 사용한다.
- 키가 노출되었다고 의심되면 즉시 rotate(재생성)한다.

## 2. 저장 위치 권장
- 개발/배포 환경: GitHub Actions Secrets, Vercel Environment Variables, 또는 운영용 비밀관리 서비스(예: AWS Secrets Manager, Azure Key Vault)
- 로컬 개발: .env 파일 사용 가능 (절대 커밋 금지). 예: `.env.local` 은 .gitignore에 포함되어야 함.

## 3. 키 교체(rotate) 절차 (긴급 권장)
1. Supabase 콘솔 → Project Settings → API → Regenerate Service Role Key
2. GitHub Repository → Settings → Secrets → Actions 에서 SUPABASE_SERVICE_ROLE_KEY 값 업데이트
3. (옵션) Vercel/배포 환경에 저장된 키 업데이트
4. 배포 워크플로(또는 수동 스크립트)를 재실행하여 정상 동작 확인
5. 이전 키가 어디에 노출되었는지(채팅/로그/File 등) 기록하고 접근 로그 검토

## 4. 개발자 접근 권한
- 관리자 계정은 필요한 최소 인원만 가질 것
- 로컬에서 작업할 때는 개인용 액세스 토큰/SSH 키를 사용
- 공유 계정 사용 최소화

## 5. CI/CD 시크릿 주입 가이드
- GitHub Actions: Repository → Settings → Secrets → Actions 에 키 등록
- Secrets 이름 예시:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL
- 워크플로에서는 secrets를 직접 출력하지 않도록 주의

## 6. 운영 시 모니터링/로그
- Supabase 콘솔의 접속 로그와 DB 연결 로그를 주기적으로 확인
- 의심스러운 활동(비정상적 쿼리, 다량의 실패 로그인 시도 등)을 발견하면 즉시 키 회수 및 로그 조사

## 7. 권장 대응 템플릿 (키 노출 의심 시)
1. 즉시 해당 키 폐기(rotate)
2. 새 키 발급 및 모든 배포 비밀 갱신
3. 최근 배포/변경 내역 검토
4. 관련 시나리오(누가, 언제, 어떤 명령 실행 등)를 기록
5. 필요 시 법률/보안팀에 보고

---

## 8. 비고
- 현재 세션에서 사용한 Service Role Key는 노출된 것으로 간주하고 가능하면 즉시 rotate 권장.
- 운영 과정에서 나는 시크릿을 직접 보관하지 않음. 내가 도울 수 있는 건 안전한 교체 절차와 자동화 스크립트 제공뿐이다.

# OPERATIONS.md

골프왕부킹 운영 시작 전후 체크용 문서.

## 1. 운영 시작 전
- 관리자 Auth 계정 생성
- `admin_profiles` 연결 SQL 실행
- 샘플 골프장/정책/출처 데이터 최종 검수
- `npm run build` 성공 재확인
- 배포 환경 변수 설정 완료
- Service Role Key rotate 상태 확인

## 2. 운영자가 자주 하는 일
### 골프장 추가
1. `/admin/courses/new` 접속
2. 기본 정보 입력 후 저장
3. `/admin/courses/[id]`에서 정책 추가
4. 출처/source 기록 추가
5. `verification_status`를 `verified`로 전환

### 기존 정책 수정
1. `/admin/courses`에서 대상 골프장 선택
2. 기본 정보 또는 정책 수정
3. 출처 기록 추가/갱신
4. 최근 검수일과 상태 확인

### 사용자 제보 처리
1. `/admin/reports` 접속
2. 제보 내용 확인
3. 골프장/정책/출처 수정
4. 필요 시 `status`, `resolved_note` 등 후속 로직 추가 예정

## 3. 운영 루틴 권장
### 매일
- 신규 제보 확인
- 최근 변경한 골프장 1~3개 재검토

### 매주
- `last_verified_at` 오래된 골프장 점검
- 링크 깨진 골프장 점검
- 정책 요약 문구 정리

## 4. 릴리즈 전 체크
- 홈 검색 정상
- `/search` 정상
- `/courses/[slug]` 정상
- `/admin/login` 정상
- `/admin/courses` 정상
- 골프장 신규 등록/수정 정상
- 정책 CRUD 정상
- 출처 기록 추가 정상

## 5. 추후 운영 고도화 후보
- 관리자 role별 권한 세분화
- 제보 처리 상태 변경 UI
- 최근 검수일 자동 갱신
- 정책 변경 이력 자동 로그 저장
- `user_reports` 처리 워크플로 UI

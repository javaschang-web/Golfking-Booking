# BULK_INPUT_GUIDE.md

운영자가 여러 골프장을 빠르게 입력하기 위한 템플릿 가이드.

## 템플릿 위치
- `data/templates/golf_courses_sample.csv`
- `data/templates/booking_policies_sample.csv`
- `data/templates/source_records_sample.csv`
- `data/templates/golf_courses_20_template.csv`
- `data/templates/booking_policies_20_template.csv`
- `data/templates/source_records_20_template.csv`

## 권장 입력 순서
1. `golf_courses_20_template.csv` 기준으로 골프장 기본 정보 정리
2. `booking_policies_20_template.csv` 기준으로 각 골프장 정책 정리
3. `source_records_20_template.csv` 기준으로 출처 기록 정리
4. `npm run bulk:check`
5. `npm run bulk:import`

## 최소 필수 컬럼
### golf_courses
- `slug`
- `name`
- `region_primary`

### booking_policies
- `course_slug`
- `policy_type`
- `is_active`

### source_records
- `course_slug`
- `source_type`

## 운영 팁
- 먼저 CSV 초안 작성 → 관리자 UI 반영 → 검수 상태 업데이트 흐름이 제일 안전함
- 정책 원문(`source_text`)과 출처 원문(`captured_text`)은 최대한 남겨두는 게 좋음

## 로컬 bulk import 실행
사전 검증(dry-run):
```bash
npm run bulk:check
```

현재 템플릿 기준 dry-run 통과 확인 완료.
중복 slug / 정책 조합이 있으면 dry-run 단계에서 바로 실패하도록 보강됨.

실제 반영:
```bash
npm run bulk:import
```

특정 폴더를 쓰고 싶으면:
```bash
node ./scripts/bulk-import.mjs ./data/templates --dry-run
node ./scripts/bulk-import.mjs ./data/templates
```

필수 env:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

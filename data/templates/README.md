# data/templates

운영용 입력 템플릿 모음.

## 파일
- `golf_courses_sample.csv` : 최소 샘플 2건
- `booking_policies_sample.csv` : 정책 샘플 2건
- `source_records_sample.csv` : 출처 샘플 2건
- `golf_courses_20_template.csv` : 골프장 20개 확장 템플릿
- `booking_policies_20_template.csv` : 20개 골프장 대응 정책 확장 템플릿
- `source_records_20_template.csv` : 20개 골프장 대응 출처 확장 템플릿

## 추천 사용 순서
1. `golf_courses_20_template.csv` 초안 작성
2. 필요한 골프장만 `golf_courses_sample.csv` 형식으로 정리
3. 정책/출처 CSV 작성
4. `npm run bulk:check`
5. `npm run bulk:import`

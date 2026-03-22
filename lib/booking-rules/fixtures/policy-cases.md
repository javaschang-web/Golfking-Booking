# Booking policy test cases

## days_before
- playDate: `2026-04-30`
- days_before_open: `21`
- open_time: `10:00`
- expected summary: `21일 전 10:00 오픈`

## weekday_rule
- rule example: `매주 월요일 오전 9시 다음 주 오픈`
- playDate: `2026-04-23` (목)
- open_weekday: `1` (월)
- open_time: `09:00`
- expected behavior: 플레이 날짜가 속한 주보다 이전 주 월요일 09:00 또는 정책 해석상 가장 가까운 사전 오픈 시점 계산

## monthly_batch
- rule example: `매월 1일 오전 9시 익월 전체 오픈`
- playDate: `2026-05-20`
- monthly_open_day: `1`
- monthly_offset_months: `1`
- open_time: `09:00`
- expected behavior: 2026-04-01 09:00 KST 계산

## manual
- manual_open_datetime must be returned as-is

## review notes
- weekday_rule / monthly_batch는 골프장별 해석 차이가 커서 이후 정책 세부 타입 보강 필요
- 복합 정책(custom_formula)은 현재 `needs_review` 처리

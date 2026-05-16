# Policy conflicts TODO (staging vs templates)

This doc tracks remaining `policy_conflicts` after normalization attempts.

## Current state (after normalization)
- We have eliminated course-level diffs (with `REALISTIC_DRY_RUN_IGNORE_FIELDS=booking_note`).
- Remaining policy conflicts are cases where **templates still lack confirmed numeric/time fields** (or are intentionally blank), and/or rules differ from staging.

## Remaining conflicts (slugs)

### 1) golfzon-county-cheonan (ONLY REMAINING)
- Status: **still conflicting by design** (A-strategy: template left blank until official text is captured)
- Staging has:
  - days_before_open: 28
  - open_time: 09:00:00
  - policy_summary mentions: "매주 월요일 09:00, 4주 뒤(월~일) 오픈"
- Template currently:
  - days_before_open / open_weekday / open_time: **blank**
  - source_text: "공식 홈페이지 공개 페이지에서 예약 오픈 규칙 텍스트를 확인하지 못함. 로그인/앱 화면 캡처 필요."
- Action needed:
  - Capture official rule text (screenshot from logged-in web/app).
  - Once captured, fill template accordingly to remove the conflict.

## Resolved (official source confirmed)

### sky72-ocean
- Confirmed via official SKY72 reservation info:
  - "매일 오전 9시에 당일 포함한 14일 이후 일자의 예약 티타임이 오픈됩니다."
  - NOTE: User decided to keep **Club72 notice (28 days)** as the canonical rule for our templates.

### solmoro
- Confirmed via official notice:
  - "평일 - 4주전 월요일 오전 9시(월,화,수,목)"
  - Source: https://www.solmoro.com/Board/BoardView?board_idx=1&bd_main_seq=143

### lotte-skyhill-jeju
- Confirmed via official reservation guide:
  - "예약일 60일 전부터 가능"
  - Applied to template (days_before_open=60)
  - Also updated staging DB (days_before_open=60) and deactivated duplicate days_before policies.

### clubd-geumgang
- Confirmed via official use guide:
  - "인터넷 오픈일 : 5주전 월요일 AM09:00"
  - Source: https://www.clubd.com/geumgang/guide/useGuide.do

## Notes
- If we want to reduce noise, we can update realistic-dry-run policy comparison logic to normalize:
  - time format (HH:MM -> HH:MM:SS)
  - empty string -> null
  - numeric strings -> numeric
- But for the items above, the issue is primarily lack of confirmed values, not formatting.

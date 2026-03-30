# Policy conflicts TODO (staging vs templates)

This doc tracks remaining `policy_conflicts` after normalization attempts.

## Current state (after normalization)
- We have eliminated course-level diffs (with `REALISTIC_DRY_RUN_IGNORE_FIELDS=booking_note`).
- Remaining policy conflicts are cases where **templates still lack confirmed numeric/time fields** (or are intentionally blank), and/or rules differ from staging.

## Remaining conflicts (slugs)

### 1) golfzon-county-cheonan
- Staging has:
  - open_weekday: 1 (Mon)
  - open_time: 09:00:00
  - policy_summary mentions: "매주 월요일 09:00, 4주 뒤(월~일) 오픈"
- Template currently:
  - days_before_open / open_weekday / open_time: empty
  - source_text says rule text is not visible
- Action needed:
  - Confirm official rule text (mobile/booking policy screen). If confirmed, set:
    - open_weekday=1, open_time=09:00:00, days_before_open=28 (if the "4주" is correct)

### 2) sky72-ocean
- Staging has:
  - days_before_open: 14
  - open_time: 09:00:00
- Template currently: empty numeric/time
- Action needed:
  - Confirm Ocean course booking open rule (Club72 notice likely refers to other courses).
  - If legacy is correct: days_before_open=14, open_time=09:00:00

### 3) solmoro
- Staging has:
  - open_weekday: 1
  - open_time: 09:00:00
  - policy_summary mentions: "정회원 기준 4주 전 월요일 09:00"
- Template currently: empty numeric/time
- Action needed:
  - Confirm whether Solmoro is actually "4 weeks before Monday 09:00" or a different process.
  - If correct: open_weekday=1, open_time=09:00:00, days_before_open=28

### 4) lotte-skyhill-jeju
- Staging has:
  - open_weekday: 2
  - open_time: 10:00:00
  - policy_summary mentions: "8~9주 전 화요일 10:00"
- Template currently: empty numeric/time
- Action needed:
  - Confirm official rule. If confirmed, decide policy:
    - lower-bound strategy: days_before_open=56 (8 weeks)
    - or store range separately (future enhancement)

### 5) clubd-geumgang
- Template now has:
  - days_before_open=3 (derived from cancellation rule text)
- Staging policy is "unknown" (null)
- Action needed:
  - Decide whether cancellation days can be used as open-rule proxy.
  - Recommended: treat as **unconfirmed** until official booking open rule is found.

## Notes
- If we want to reduce noise, we can update realistic-dry-run policy comparison logic to normalize:
  - time format (HH:MM -> HH:MM:SS)
  - empty string -> null
  - numeric strings -> numeric
- But for the items above, the issue is primarily lack of confirmed values, not formatting.

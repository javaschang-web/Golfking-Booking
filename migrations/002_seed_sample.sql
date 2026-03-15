-- 002_seed_sample.sql
-- Sample seed data for GolfKing Booking MVP (5 courses)

-- Insert admin (example) - adjust UUIDs or rely on Supabase auth integration
insert into admin_profiles (id, email, role, display_name)
values
  (gen_random_uuid(), 'admin@example.com', 'owner', 'Admin');

-- Insert sample golf courses
insert into golf_courses (slug, name, region_primary, region_secondary, address, phone, homepage_url, booking_url, map_url, membership_required, booking_note, verification_status, last_verified_at)
values
  ('seowon-hills', '서원힐스', '경기', '파주', '경기도 파주시 예시로 123', '031-111-1111', 'https://seowon.example.com', 'https://seowon.example.com/reserve', 'https://maps.example.com/seowon', false, '주말 인기', 'verified', now()),
  ('new-hills', '뉴힐스GC', '경기', '용인', '경기도 용인시 예시로 45', '031-222-2222', 'https://newhills.example.com', 'https://newhills.example.com/reserve', 'https://maps.example.com/newhills', false, '비회원 가능', 'verified', now()),
  ('pinevalley', '파인밸리', '강원', '춘천', '강원도 춘천시 예시로 67', '033-333-3333', 'https://pinevalley.example.com', null, 'https://maps.example.com/pinevalley', true, '회원제', 'verified', now()),
  ('sunrise-gc', '선라이즈GC', '충남', '천안', '충청남도 천안시 예시로 89', '041-444-4444', 'https://sunrise.example.com', 'https://sunrise.example.com/reserve', 'https://maps.example.com/sunrise', false, '월 단위 오픈 존재', 'verified', now()),
  ('coastal-park', '코스탈파크', '제주', '제주시', '제주도 제주시 예시로 101', '064-555-5555', 'https://coastal.example.com', 'https://coastal.example.com/reserve', 'https://maps.example.com/coastal', false, '관광지 인근', 'verified', now());

-- Insert booking policies for sample courses
insert into booking_policies (golf_course_id, policy_type, policy_summary, source_text, days_before_open, open_time, is_active, last_verified_at)
select gc.id, 'days_before', '이용일 21일 전 오전 10시 오픈', '예약은 이용일 3주 전 오전 10시부터 가능합니다.', 21, '10:00', true, now()
from golf_courses gc where gc.slug = 'seowon-hills';

insert into booking_policies (golf_course_id, policy_type, policy_summary, source_text, open_weekday, open_time, rule_interpretation, is_active, last_verified_at)
select gc.id, 'weekday_rule', '매주 월요일 오전 9시 다음 주 오픈', '매주 월요일 오전 9시부터 다음 주 예약이 열립니다.', 1, '09:00', 'next_week', true, now()
from golf_courses gc where gc.slug = 'new-hills';

insert into booking_policies (golf_course_id, policy_type, policy_summary, source_text, manual_open_datetime, is_active, last_verified_at)
select gc.id, 'manual', '공지 기준 수동 오픈', '공지사항에 따름. 별도 안내 시 수동 입력.', null, true, now()
from golf_courses gc where gc.slug = 'pinevalley';

insert into booking_policies (golf_course_id, policy_type, policy_summary, source_text, monthly_open_day, open_time, monthly_offset_months, rule_interpretation, is_active, last_verified_at)
select gc.id, 'monthly_batch', '매월 1일 오전 9시 익월 전체 오픈', '매월 1일 오전 9시에 익월 전체 오픈합니다.', 1, '09:00', 1, 'next_month', true, now()
from golf_courses gc where gc.slug = 'sunrise-gc';

insert into booking_policies (golf_course_id, policy_type, policy_summary, source_text, days_before_open, open_time, is_active, last_verified_at)
select gc.id, 'days_before', '이용일 7일 전 오전 10시 오픈', '이용일 7일 전 오전 10시 오픈합니다.', 7, '10:00', true, now()
from golf_courses gc where gc.slug = 'coastal-park';

-- Insert source records minimal
insert into source_records (golf_course_id, booking_policy_id, source_type, source_url, source_title, captured_text, is_current, checked_at)
select gc.id, bp.id, 'homepage', 'https://example.com/notice', '예약 안내', bp.source_text, true, now()
from golf_courses gc
join booking_policies bp on bp.golf_course_id = gc.id
where gc.slug in ('seowon-hills','new-hills','pinevalley','sunrise-gc','coastal-park');

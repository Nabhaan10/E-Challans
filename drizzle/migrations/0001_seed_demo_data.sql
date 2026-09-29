
-- DEMO / SAMPLE DATA. All accounts use password Demo@1234. Rules are SAMPLE entries, not verified law.
do $$
declare
  u record;
  names text[] := array['Arjun Menon','Priya Nair','Rahul Varma','Anjali Pillai','Mohammed Faisal','Sneha Thomas','Vishnu Kumar','Fathima Rahman','Joseph Mathew','Lakshmi Iyer'];
  onames text[] := array['SI Suresh Babu','SI Deepa Krishnan','ASI Manoj Kurian','SI Ramesh Nambiar','ASI Shalini George'];
  stations text[] := array['Kottayam Traffic PS','Ernakulam Traffic PS','Thiruvananthapuram Traffic PS','Kottayam Traffic PS','Ernakulam Traffic PS'];
  i int;
  uid uuid;
  em text;
  nm text;
begin
  for i in 0..15 loop
    if i = 0 then uid := 'a0000000-0000-0000-0000-000000000001'; em := 'admin@demo.in'; nm := 'Admin — RTO Control Room';
    elsif i <= 5 then uid := ('b0000000-0000-0000-0000-00000000000' || i)::uuid; em := 'officer' || i || '@demo.in'; nm := onames[i];
    else uid := ('c0000000-0000-0000-0000-0000000000' || lpad((i-5)::text,2,'0'))::uuid; em := 'citizen' || (i-5) || '@demo.in'; nm := names[i-5];
    end if;
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt('Demo@1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', nm), now() - interval '90 days', now(),
      '', '', '', '', '', '', '', '', false, false);
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid::text, uid, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
    update public.profiles set is_demo = true, phone = '+91 98' || lpad((47000000 + i*1373)::text, 8, '0'),
      license_no = case when i > 5 then 'KL05 2015' || lpad((i*731)::text, 7, '0') end,
      license_expiry = case when i > 5 then current_date + ((i*97) % 900 - 60) end
    where id = uid;
    if i = 0 then
      update public.user_roles set role = 'admin' where user_id = uid;
    elsif i <= 5 then
      update public.user_roles set role = 'officer' where user_id = uid;
      insert into public.officers(user_id, badge_no, rank, station) values (uid, 'KL-TRF-' || (1040 + i), split_part(onames[i],' ',1), stations[i]);
    end if;
  end loop;
end $$;

insert into public.system_settings(key, value) values
 ('escalation', '{"payment_due_days":30,"reminder_days_before_due":7,"escalate_after_days_overdue":30}'),
 ('duplicate_detection', '{"window_hours":6,"radius_m":500,"auto_reject":false}');

insert into public.traffic_violations(code, name, category, description, why_exists) values
('NO_HELMET','No Helmet','Safety Equipment','Riding or pillion-riding a two-wheeler without wearing a protective helmet.','Helmets greatly reduce the risk of fatal head injuries for two-wheeler riders in a crash.'),
('NO_SEATBELT','No Seat Belt','Safety Equipment','Driving or travelling in a motor vehicle without wearing a seat belt.','Seat belts keep occupants in place during sudden braking or collisions and reduce serious injuries.'),
('SIGNAL_JUMP','Signal Violation','Traffic Control','Crossing a stop line or junction against a red traffic signal.','Signals give each direction of traffic a safe turn; ignoring them causes right-angle collisions and endangers pedestrians.'),
('SPEEDING','Speeding','Driving Behaviour','Driving above the notified speed limit for the road or vehicle class.','Higher speed means longer stopping distances and more severe crashes.'),
('WRONG_PARKING','Wrong Parking','Parking','Parking in a no-parking zone, on footpaths, or in a way that obstructs traffic.','Improper parking blocks traffic, emergency vehicles and pedestrians.'),
('NO_LICENSE','Driving Without Valid License','Documents','Driving a motor vehicle without holding a valid driving licence for that class.','Licensing ensures drivers have been tested on skills and road rules.'),
('MOBILE_USE','Using Mobile Phone While Driving','Driving Behaviour','Using a handheld mobile device while driving.','Phone use takes attention off the road and slows reaction time.'),
('TRIPLE_RIDING','Triple Riding','Safety Equipment','Carrying more than one pillion rider on a two-wheeler.','Overloading a two-wheeler reduces balance and braking control.'),
('NO_INSURANCE','No Insurance','Documents','Driving a vehicle without a valid third-party insurance policy.','Insurance ensures victims of accidents can be compensated.'),
('EXPIRED_PUC','Expired PUC','Documents','Driving without a valid Pollution Under Control certificate.','PUC checks help limit vehicle emissions and air pollution.'),
('DRUNK_DRIVING','Drunk Driving','Driving Behaviour','Driving with blood alcohol above the permitted limit.','Alcohol impairs judgement and coordination and is a leading cause of fatal crashes.');

insert into public.traffic_rules(violation_id, legal_act, section, applicability, vehicle_types, effective_from, source, is_sample)
select v.id, 'Motor Vehicles Act, 1988 (as amended in 2019)', x.section, 'CENTRAL', x.vt::public.vehicle_type[], '2019-09-01',
  'SAMPLE/DEMO ENTRY — modelled on the MV (Amendment) Act 2019. Not officially verified; confirm against the Gazette and state notification before use.', true
from (values
 ('NO_HELMET','Sec 194D','{MOTORCYCLE,SCOOTER}'),
 ('NO_SEATBELT','Sec 194B(1)','{CAR,BUS,TRUCK,OTHER}'),
 ('SIGNAL_JUMP','Sec 184',null),
 ('SPEEDING','Sec 183(1)(i)','{MOTORCYCLE,SCOOTER,CAR,AUTO_RICKSHAW,OTHER}'),
 ('SPEEDING','Sec 183(1)(ii)','{BUS,TRUCK}'),
 ('WRONG_PARKING','Sec 177 / Sec 122',null),
 ('NO_LICENSE','Sec 181',null),
 ('MOBILE_USE','Sec 184(c)',null),
 ('TRIPLE_RIDING','Sec 194C','{MOTORCYCLE,SCOOTER}'),
 ('NO_INSURANCE','Sec 196',null),
 ('EXPIRED_PUC','Sec 190(2)',null),
 ('DRUNK_DRIVING','Sec 185',null)
) as x(code, section, vt) join public.traffic_violations v on v.code = x.code;

insert into public.violation_penalties(rule_id, base_fine, additional_penalty, additional_penalty_note)
select r.id, x.fine, 0, x.note from public.traffic_rules r join public.traffic_violations v on v.id = r.violation_id
join (values
 ('Sec 194D',1000,'Sample note: licence may be subject to suspension as per the Act.'),
 ('Sec 194B(1)',1000,null),('Sec 184',1000,null),('Sec 183(1)(i)',1000,null),('Sec 183(1)(ii)',2000,null),
 ('Sec 177 / Sec 122',500,null),('Sec 181',5000,null),('Sec 184(c)',1000,null),('Sec 194C',1000,null),
 ('Sec 196',2000,'Sample note: higher amount applies for subsequent offence.'),('Sec 190(2)',2000,null),('Sec 185',10000,null)
) as x(section, fine, note) on x.section = r.section;

insert into public.locations(name, area, city, lat, lng) values
('Baker Junction','Kottayam Town','Kottayam',9.5874,76.5218),
('MC Road Junction','Nagampadam','Kottayam',9.5963,76.5302),
('Kumarakom Road','Illickal','Kottayam',9.5989,76.5021),
('Vyttila Hub','Vyttila','Kochi',9.9674,76.3183),
('Edappally Junction','Edappally','Kochi',10.0261,76.3083),
('MG Road','Ravipuram','Kochi',9.9658,76.2881),
('Kaloor Junction','Kaloor','Kochi',9.9971,76.2994),
('Thampanoor','Thampanoor','Thiruvananthapuram',8.4875,76.9525),
('Kazhakkoottam','Kazhakkoottam','Thiruvananthapuram',8.5686,76.8731),
('Pattom Junction','Pattom','Thiruvananthapuram',8.5241,76.9427);

insert into public.vehicles(reg_no, owner_id, vehicle_type, make, model, fuel_type, registration_date, registration_expiry, insurance_expiry, puc_expiry, is_demo)
values
('KL07AB1234','c0000000-0000-0000-0000-000000000001','MOTORCYCLE','Royal Enfield','Classic 350','Petrol','2019-06-12','2034-06-11', current_date + 120, current_date + 18, true),
('KL07CD5678','c0000000-0000-0000-0000-000000000001','CAR','Maruti Suzuki','Swift','Petrol','2021-02-03','2036-02-02', current_date + 200, current_date + 90, true),
('KL05AF4321','c0000000-0000-0000-0000-000000000002','SCOOTER','Honda','Activa 6G','Petrol','2020-08-19','2035-08-18', current_date - 10, current_date + 40, true),
('KL05BG9087','c0000000-0000-0000-0000-000000000002','CAR','Hyundai','Creta','Diesel','2022-01-10','2037-01-09', current_date + 300, current_date + 150, true),
('KL07BH2468','c0000000-0000-0000-0000-000000000003','MOTORCYCLE','Bajaj','Pulsar 150','Petrol','2018-11-05','2033-11-04', current_date + 25, current_date - 5, true),
('KL07CJ1357','c0000000-0000-0000-0000-000000000004','CAR','Tata','Nexon EV','Electric','2023-03-22','2038-03-21', current_date + 400, null, true),
('KL01AK8642','c0000000-0000-0000-0000-000000000005','AUTO_RICKSHAW','Bajaj','RE Compact','CNG','2017-07-14','2032-07-13', current_date + 60, current_date + 12, true),
('KL01BL7531','c0000000-0000-0000-0000-000000000005','MOTORCYCLE','TVS','Apache RTR 160','Petrol','2021-09-30','2036-09-29', current_date + 180, current_date + 70, true),
('KL07DM3690','c0000000-0000-0000-0000-000000000006','SCOOTER','Suzuki','Access 125','Petrol','2022-05-18','2037-05-17', current_date + 90, current_date + 30, true),
('KL05CN2580','c0000000-0000-0000-0000-000000000007','CAR','Toyota','Innova Crysta','Diesel','2020-12-01','2035-11-30', current_date + 45, current_date + 100, true),
('KL05DP1470','c0000000-0000-0000-0000-000000000007','TRUCK','Ashok Leyland','Dost+','Diesel','2019-04-09','2034-04-08', current_date + 15, current_date + 20, true),
('KL01CQ3691','c0000000-0000-0000-0000-000000000008','SCOOTER','TVS','Jupiter','Petrol','2021-06-25','2036-06-24', current_date + 250, current_date + 160, true),
('KL07ER4812','c0000000-0000-0000-0000-000000000009','BUS','Tata','Starbus','Diesel','2018-02-14','2033-02-13', current_date + 75, current_date + 35, true),
('KL07FS5923','c0000000-0000-0000-0000-000000000009','CAR','Mahindra','XUV700','Diesel','2023-07-07','2038-07-06', current_date + 320, current_date + 210, true),
('KL01DT6034','c0000000-0000-0000-0000-000000000010','MOTORCYCLE','Yamaha','FZ-S','Petrol','2020-10-10','2035-10-09', current_date + 5, current_date + 55, true),
('KL05EU7145','c0000000-0000-0000-0000-000000000010','CAR','Honda','City','Petrol','2019-01-28','2034-01-27', current_date + 140, current_date - 20, true);

do $$
declare
  i int; v record; r record; loc record; cnt int; st public.challan_status; iss timestamptz;
  off uuid; c public.challans; a_id uuid; vids uuid[]; lids uuid[];
begin
  select array_agg(id order by reg_no) into vids from public.vehicles;
  select array_agg(id order by name) into lids from public.locations;
  for i in 1..42 loop
    select * into v from public.vehicles where id = vids[(i % array_length(vids,1)) + 1];
    select count(*) into cnt from public.traffic_rules tr where tr.vehicle_types is null or v.vehicle_type = any(tr.vehicle_types);
    select tr.id, tr.violation_id, p.base_fine, p.additional_penalty into r from public.traffic_rules tr join public.violation_penalties p on p.rule_id = tr.id
      where tr.vehicle_types is null or v.vehicle_type = any(tr.vehicle_types) order by tr.section offset ((i*5) % cnt) limit 1;
    select * into loc from public.locations where id = lids[((i*7) % 10) + 1];
    st := case
      when i in (19, 39) then 'ESCALATED'
      when i % 10 in (0,1,2,3) then 'PAID'
      when i % 10 in (4,5) then 'PENDING'
      when i % 10 = 6 then 'DISPUTED'
      when i % 10 = 7 then 'UNDER_REVIEW'
      when i % 10 = 8 then 'OVERDUE'
      else 'RESOLVED' end;
    iss := case st when 'ESCALATED' then now() - interval '75 days' - make_interval(hours => i)
                  when 'OVERDUE' then now() - interval '45 days' - make_interval(hours => i)
                  when 'PENDING' then now() - make_interval(days => (i % 20) + 1, hours => i % 9)
                  else now() - make_interval(days => (i*37) % 60, mins => (i*113) % 600) end;
    off := ('b0000000-0000-0000-0000-00000000000' || ((i % 5) + 1))::uuid;
    insert into public.challans(challan_no, vehicle_id, owner_id, rule_id, violation_id, officer_id, location_id, location_text, lat, lng, issued_at, due_date, base_fine, additional_penalty, amount, remarks, status, is_demo)
    values ('CH-' || lpad((100000 + (i*7919) % 900000)::text, 6, '0'), v.id, v.owner_id, r.id, r.violation_id, off, loc.id, loc.name || ', ' || loc.city,
      loc.lat + ((i % 5) - 2) * 0.0009, loc.lng + ((i % 3) - 1) * 0.0011, iss, (iss::date + 30), r.base_fine, r.additional_penalty, r.base_fine + r.additional_penalty,
      'Demo record — observed during routine checking.', st, true)
    returning * into c;
    insert into public.notifications(user_id, type, title, body, link, read, created_at)
    values (c.owner_id, 'CHALLAN_ISSUED', 'New challan ' || c.challan_no, 'Amount ₹' || c.amount || ' at ' || c.location_text, '/challans/' || c.id, st <> 'PENDING', c.issued_at);
    insert into public.audit_logs(actor_id, actor_role, action, entity, entity_id, metadata, created_at)
    values (off, 'officer', 'CHALLAN_CREATE', 'challan', c.id::text, jsonb_build_object('challan_no', c.challan_no, 'amount', c.amount, 'demo', true), c.issued_at);
    if st = 'PAID' then
      insert into public.payments(transaction_id, challan_id, payer_id, amount, method, paid_at, idempotency_key)
      values ('TXNDEMO' || lpad(i::text, 5, '0'), c.id, c.owner_id, c.amount, (array['UPI','CARD','NETBANKING']::public.payment_method[])[(i % 3) + 1], c.issued_at + interval '2 days', 'demo-' || i);
      insert into public.audit_logs(actor_id, actor_role, action, entity, entity_id, metadata, created_at)
      values (c.owner_id, 'citizen', 'PAYMENT', 'payment', c.id::text, jsonb_build_object('challan_no', c.challan_no, 'amount', c.amount, 'demo', true), c.issued_at + interval '2 days');
    elsif st in ('DISPUTED','UNDER_REVIEW','RESOLVED') then
      insert into public.appeals(challan_id, citizen_id, ground, explanation, status, reviewer_id, decision_notes, created_at, decided_at)
      values (c.id, c.owner_id, (array['Signage concern','Incorrect location','Evidence issue','Duplicate challan'])[(i % 4) + 1],
        'Demo appeal: I believe the details recorded need to be re-checked. Photos of the spot are available on request.',
        case st when 'DISPUTED' then 'SUBMITTED'::public.appeal_status when 'UNDER_REVIEW' then 'UNDER_REVIEW'::public.appeal_status else 'APPROVED'::public.appeal_status end,
        case when st <> 'DISPUTED' then off end,
        case when st = 'RESOLVED' then 'Demo decision: evidence did not clearly establish the violation.' end,
        c.issued_at + interval '3 days', case when st = 'RESOLVED' then c.issued_at + interval '8 days' end)
      returning id into a_id;
      insert into public.appeal_events(appeal_id, status, actor_id, note, created_at) values (a_id, 'SUBMITTED', c.owner_id, 'Appeal submitted', c.issued_at + interval '3 days');
      if st in ('UNDER_REVIEW','RESOLVED') then
        insert into public.appeal_events(appeal_id, status, actor_id, note, created_at) values (a_id, 'UNDER_REVIEW', off, 'Review started', c.issued_at + interval '5 days');
      end if;
      if st = 'RESOLVED' then
        insert into public.appeal_events(appeal_id, status, actor_id, note, created_at) values (a_id, 'APPROVED', off, 'Demo decision: evidence did not clearly establish the violation.', c.issued_at + interval '8 days');
      end if;
    end if;
  end loop;
end $$;

insert into public.notifications(user_id, type, title, body, link) values
('c0000000-0000-0000-0000-000000000001','DOC_EXPIRY','KL07AB1234 document reminder','PUC expires in 18 days.','/vehicles/' || (select id from public.vehicles where reg_no='KL07AB1234'));

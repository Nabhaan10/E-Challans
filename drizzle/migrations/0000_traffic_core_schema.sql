
create type public.app_role as enum ('admin','officer','citizen');
create type public.vehicle_type as enum ('MOTORCYCLE','SCOOTER','CAR','BUS','TRUCK','AUTO_RICKSHAW','OTHER');
create type public.challan_status as enum ('PENDING','PAID','DISPUTED','UNDER_REVIEW','RESOLVED','OVERDUE','ESCALATED');
create type public.appeal_status as enum ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED');
create type public.payment_method as enum ('UPI','CARD','NETBANKING');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  email text,
  phone text,
  license_no text,
  license_expiry date,
  state text default 'Kerala',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
create table public.officers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  badge_no text unique not null,
  rank text not null default 'Sub Inspector',
  station text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','officer'))
$$;
create or replace function public.primary_role(_user_id uuid)
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = _user_id
  order by case role when 'admin' then 1 when 'officer' then 2 else 3 end limit 1
$$;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);
create table public.traffic_violations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null,
  description text not null,
  why_exists text not null,
  created_at timestamptz not null default now()
);
create table public.traffic_rules (
  id uuid primary key default gen_random_uuid(),
  violation_id uuid not null references public.traffic_violations(id) on delete cascade,
  legal_act text not null,
  section text not null,
  applicability text not null default 'CENTRAL' check (applicability in ('CENTRAL','STATE')),
  state text,
  vehicle_types public.vehicle_type[],
  effective_from date not null default current_date,
  effective_until date,
  source text not null,
  last_verified date,
  is_sample boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.violation_penalties (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null unique references public.traffic_rules(id) on delete cascade,
  base_fine integer not null check (base_fine >= 0),
  additional_penalty integer not null default 0 check (additional_penalty >= 0),
  additional_penalty_note text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  reg_no text unique not null check (reg_no ~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$|^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$'),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_type public.vehicle_type not null,
  make text not null,
  model text not null,
  fuel_type text not null default 'Petrol',
  registration_date date not null,
  registration_expiry date,
  insurance_expiry date,
  puc_expiry date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.vehicles(owner_id);

create table public.challans (
  id uuid primary key default gen_random_uuid(),
  challan_no text unique not null,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  owner_id uuid not null references public.profiles(id),
  rule_id uuid not null references public.traffic_rules(id),
  violation_id uuid not null references public.traffic_violations(id),
  officer_id uuid references public.profiles(id),
  location_id uuid references public.locations(id),
  location_text text not null,
  lat double precision,
  lng double precision,
  issued_at timestamptz not null default now(),
  due_date date not null default (current_date + 30),
  base_fine integer not null,
  additional_penalty integer not null default 0,
  amount integer not null,
  remarks text,
  status public.challan_status not null default 'PENDING',
  reminder_sent_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.challans(owner_id);
create index on public.challans(vehicle_id);
create index on public.challans(status);
create index on public.challans(issued_at);

create table public.challan_evidence (
  id uuid primary key default gen_random_uuid(),
  challan_id uuid not null references public.challans(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  storage_path text not null,
  sha256 text not null,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.challan_evidence(challan_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique not null,
  challan_id uuid not null references public.challans(id) on delete cascade,
  payer_id uuid references public.profiles(id),
  amount integer not null,
  method public.payment_method not null,
  status text not null default 'SUCCESS',
  idempotency_key text unique,
  paid_at timestamptz not null default now()
);
create unique index payments_one_success on public.payments(challan_id) where status = 'SUCCESS';

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  challan_id uuid not null references public.challans(id) on delete cascade,
  citizen_id uuid not null references public.profiles(id),
  ground text not null,
  explanation text not null check (char_length(explanation) between 10 and 2000),
  attachment_path text,
  status public.appeal_status not null default 'SUBMITTED',
  reviewer_id uuid references public.profiles(id),
  decision_notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index on public.appeals(challan_id);
create table public.appeal_events (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals(id) on delete cascade,
  status public.appeal_status not null,
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, read);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs(created_at desc);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create view public.document_expiry with (security_invoker = true) as
select v.id as vehicle_id, v.reg_no, v.owner_id, d.doc, d.expires_on,
  case when d.expires_on is null then 'UNKNOWN'
       when d.expires_on < current_date then 'EXPIRED'
       when d.expires_on <= current_date + 30 then 'EXPIRING_SOON'
       else 'VALID' end as state,
  (d.expires_on - current_date) as days_left
from public.vehicles v
cross join lateral (values ('INSURANCE', v.insurance_expiry), ('PUC', v.puc_expiry), ('REGISTRATION', v.registration_expiry)) as d(doc, expires_on);

grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.officers to authenticated;
grant select, insert, update, delete on public.locations, public.traffic_violations, public.traffic_rules, public.violation_penalties to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select on public.challans, public.challan_evidence, public.payments, public.appeals, public.appeal_events to authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.audit_logs to authenticated;
grant select, update on public.system_settings to authenticated;
grant select on public.document_expiry to authenticated;
grant all on all tables in schema public to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.officers enable row level security;
alter table public.locations enable row level security;
alter table public.traffic_violations enable row level security;
alter table public.traffic_rules enable row level security;
alter table public.violation_penalties enable row level security;
alter table public.vehicles enable row level security;
alter table public.challans enable row level security;
alter table public.challan_evidence enable row level security;
alter table public.payments enable row level security;
alter table public.appeals enable row level security;
alter table public.appeal_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "officers read" on public.officers for select to authenticated using (true);

create policy "ref read loc" on public.locations for select to authenticated using (true);
create policy "ref read vio" on public.traffic_violations for select to authenticated using (true);
create policy "ref read rules" on public.traffic_rules for select to authenticated using (true);
create policy "ref read pen" on public.violation_penalties for select to authenticated using (true);
create policy "admin write loc" on public.locations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write vio" on public.traffic_violations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write rules" on public.traffic_rules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write pen" on public.violation_penalties for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "vehicle read" on public.vehicles for select to authenticated using (owner_id = auth.uid() or public.is_staff(auth.uid()));
create policy "vehicle insert own" on public.vehicles for insert to authenticated with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "vehicle update own" on public.vehicles for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "vehicle delete admin" on public.vehicles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "challan read" on public.challans for select to authenticated using (owner_id = auth.uid() or public.is_staff(auth.uid()));
create policy "evidence read" on public.challan_evidence for select to authenticated using (
  public.is_staff(auth.uid()) or exists (select 1 from public.challans c where c.id = challan_id and c.owner_id = auth.uid()));
create policy "payment read" on public.payments for select to authenticated using (
  public.is_staff(auth.uid()) or exists (select 1 from public.challans c where c.id = challan_id and c.owner_id = auth.uid()));
create policy "appeal read" on public.appeals for select to authenticated using (citizen_id = auth.uid() or public.is_staff(auth.uid()));
create policy "appeal event read" on public.appeal_events for select to authenticated using (
  public.is_staff(auth.uid()) or exists (select 1 from public.appeals a where a.id = appeal_id and a.citizen_id = auth.uid()));
create policy "notif read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "audit admin" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "settings read" on public.system_settings for select to authenticated using (true);
create policy "settings admin" on public.system_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public._audit(_action text, _entity text, _entity_id text, _meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor_id, actor_role, action, entity, entity_id, metadata)
  values (auth.uid(), coalesce(public.primary_role(auth.uid())::text, 'system'), _action, _entity, _entity_id, coalesce(_meta,'{}'::jsonb));
end $$;
revoke execute on function public._audit(text,text,text,jsonb) from public, anon, authenticated;

create or replace function public._notify(_user uuid, _type text, _title text, _body text, _link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, type, title, body, link) values (_user, _type, _title, _body, _link);
$$;
revoke execute on function public._notify(uuid,text,text,text,text) from public, anon, authenticated;

create or replace function public.log_event(_action text, _entity text, _entity_id text default null, _meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _action not in ('LOGIN','LOGOUT','EVIDENCE_VIEW','EVIDENCE_VERIFY','RECEIPT_DOWNLOAD') then raise exception 'Action not allowed'; end if;
  perform public._audit(_action, _entity, _entity_id, _meta);
end $$;

create or replace function public._gen_challan_no() returns text language plpgsql set search_path = public as $$
declare n text;
begin
  loop
    n := 'CH-' || lpad((floor(random()*1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.challans where challan_no = n);
  end loop;
  return n;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email, new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'citizen') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.resolve_fine(_violation_id uuid, _vehicle_id uuid)
returns table(rule_id uuid, legal_act text, section text, base_fine int, additional_penalty int, source text, is_sample boolean, applicable boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.legal_act, r.section, p.base_fine, p.additional_penalty, r.source, r.is_sample,
    (r.vehicle_types is null or (select v.vehicle_type from public.vehicles v where v.id = _vehicle_id) = any(r.vehicle_types)) as applicable
  from public.traffic_rules r join public.violation_penalties p on p.rule_id = r.id
  where r.violation_id = _violation_id and r.active
    and r.effective_from <= current_date and (r.effective_until is null or r.effective_until >= current_date)
  order by 8 desc, (r.applicability = 'STATE') desc
  limit 1
$$;

create or replace function public.check_duplicate_challans(_vehicle_id uuid, _violation_id uuid, _lat double precision default null, _lng double precision default null, _hours int default 6)
returns table(id uuid, challan_no text, location_text text, issued_at timestamptz, status public.challan_status, distance_m double precision)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'Forbidden'; end if;
  return query
  select c.id, c.challan_no, c.location_text, c.issued_at, c.status,
    case when _lat is null or c.lat is null then null::double precision
      else 6371000 * 2 * asin(sqrt(power(sin(radians(c.lat - _lat)/2),2) + cos(radians(_lat))*cos(radians(c.lat))*power(sin(radians(c.lng - _lng)/2),2))) end
  from public.challans c
  where c.vehicle_id = _vehicle_id and c.violation_id = _violation_id and c.issued_at > now() - make_interval(hours => _hours)
  order by c.issued_at desc;
end $$;

create or replace function public.issue_challan(_vehicle_id uuid, _violation_id uuid, _location_id uuid, _location_text text, _lat double precision, _lng double precision, _remarks text, _issued_at timestamptz default now())
returns public.challans language plpgsql security definer set search_path = public as $$
declare f record; v public.vehicles; c public.challans; vio public.traffic_violations; due_days int;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Only officers can issue challans'; end if;
  select * into v from public.vehicles where id = _vehicle_id;
  if v.id is null then raise exception 'Vehicle not found'; end if;
  select * into vio from public.traffic_violations where id = _violation_id;
  select * into f from public.resolve_fine(_violation_id, _vehicle_id);
  if f.rule_id is null then raise exception 'No active rule configured for this violation'; end if;
  if not f.applicable then raise exception 'This rule does not apply to vehicle type %', v.vehicle_type; end if;
  if coalesce(trim(_location_text),'') = '' then raise exception 'Location is required'; end if;
  if _issued_at > now() + interval '5 minutes' then raise exception 'Issue time cannot be in the future'; end if;
  select coalesce((value->>'payment_due_days')::int, 30) into due_days from public.system_settings where key = 'escalation';
  insert into public.challans(challan_no, vehicle_id, owner_id, rule_id, violation_id, officer_id, location_id, location_text, lat, lng, issued_at, due_date, base_fine, additional_penalty, amount, remarks)
  values (public._gen_challan_no(), v.id, v.owner_id, f.rule_id, _violation_id, auth.uid(), _location_id, left(_location_text,200), _lat, _lng, coalesce(_issued_at, now()),
    (coalesce(_issued_at, now())::date + coalesce(due_days,30)), f.base_fine, f.additional_penalty, f.base_fine + f.additional_penalty, left(_remarks,1000))
  returning * into c;
  perform public._notify(v.owner_id, 'CHALLAN_ISSUED', 'New challan ' || c.challan_no, vio.name || ' — ₹' || c.amount || ' for ' || v.reg_no || ' at ' || c.location_text, '/challans/' || c.id);
  perform public._audit('CHALLAN_CREATE', 'challan', c.id::text, jsonb_build_object('challan_no', c.challan_no, 'reg_no', v.reg_no, 'violation', vio.code, 'amount', c.amount));
  return c;
end $$;

create or replace function public.add_evidence(_challan_id uuid, _file_name text, _file_type text, _file_size int, _storage_path text, _sha256 text)
returns public.challan_evidence language plpgsql security definer set search_path = public as $$
declare e public.challan_evidence;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Forbidden'; end if;
  if _file_type not in ('image/jpeg','image/png','application/pdf') then raise exception 'Unsupported file type'; end if;
  if _file_size > 5*1024*1024 then raise exception 'File too large (max 5MB)'; end if;
  if _sha256 !~ '^[a-f0-9]{64}$' then raise exception 'Invalid hash'; end if;
  if split_part(_storage_path,'/',1) <> _challan_id::text then raise exception 'Invalid path'; end if;
  insert into public.challan_evidence(challan_id, file_name, file_type, file_size, storage_path, sha256, uploaded_by)
  values (_challan_id, left(_file_name,200), _file_type, _file_size, _storage_path, _sha256, auth.uid()) returning * into e;
  perform public._audit('EVIDENCE_UPLOAD', 'challan_evidence', e.id::text, jsonb_build_object('challan_id', _challan_id, 'sha256', _sha256));
  return e;
end $$;

create or replace function public.pay_challan(_challan_id uuid, _method public.payment_method, _idempotency_key text)
returns public.payments language plpgsql security definer set search_path = public as $$
declare c public.challans; p public.payments;
begin
  select * into p from public.payments where idempotency_key = _idempotency_key;
  if p.id is not null then return p; end if;
  select * into c from public.challans where id = _challan_id for update;
  if c.id is null then raise exception 'Challan not found'; end if;
  if c.owner_id <> auth.uid() then raise exception 'You can only pay your own challans'; end if;
  select * into p from public.payments where challan_id = c.id and status = 'SUCCESS';
  if p.id is not null then return p; end if;
  if c.status not in ('PENDING','OVERDUE','ESCALATED') then raise exception 'Challan cannot be paid in status %', c.status; end if;
  insert into public.payments(transaction_id, challan_id, payer_id, amount, method, idempotency_key)
  values ('TXN' || to_char(now(),'YYMMDD') || upper(substr(md5(random()::text),1,8)), c.id, auth.uid(), c.amount, _method, _idempotency_key)
  returning * into p;
  update public.challans set status = 'PAID', updated_at = now() where id = c.id;
  perform public._notify(c.owner_id, 'PAYMENT_SUCCESS', 'Payment successful', '₹' || p.amount || ' paid for ' || c.challan_no || ' (Txn ' || p.transaction_id || ')', '/challans/' || c.id);
  perform public._audit('PAYMENT', 'payment', p.id::text, jsonb_build_object('challan_no', c.challan_no, 'amount', p.amount, 'method', _method, 'txn', p.transaction_id));
  return p;
end $$;

create or replace function public.submit_appeal(_challan_id uuid, _ground text, _explanation text, _attachment_path text default null)
returns public.appeals language plpgsql security definer set search_path = public as $$
declare c public.challans; a public.appeals;
begin
  select * into c from public.challans where id = _challan_id for update;
  if c.id is null or c.owner_id <> auth.uid() then raise exception 'Challan not found'; end if;
  if c.status not in ('PENDING','OVERDUE') then raise exception 'Only pending or overdue challans can be disputed'; end if;
  if _ground not in ('Incorrect vehicle number','Incorrect location','Duplicate challan','Evidence issue','Signage concern','Vehicle not present','Other') then raise exception 'Invalid ground'; end if;
  if _attachment_path is not null and (split_part(_attachment_path,'/',1) <> 'appeals' or split_part(_attachment_path,'/',2) <> auth.uid()::text) then raise exception 'Invalid attachment'; end if;
  insert into public.appeals(challan_id, citizen_id, ground, explanation, attachment_path) values (c.id, auth.uid(), _ground, _explanation, _attachment_path) returning * into a;
  insert into public.appeal_events(appeal_id, status, actor_id, note) values (a.id, 'SUBMITTED', auth.uid(), 'Appeal submitted');
  update public.challans set status = 'DISPUTED', updated_at = now() where id = c.id;
  perform public._notify(auth.uid(), 'APPEAL_SUBMITTED', 'Appeal submitted', 'Your appeal for ' || c.challan_no || ' has been received.', '/challans/' || c.id);
  if c.officer_id is not null then
    perform public._notify(c.officer_id, 'APPEAL_SUBMITTED', 'New appeal on ' || c.challan_no, _ground, '/appeals');
  end if;
  perform public._audit('APPEAL_SUBMIT', 'appeal', a.id::text, jsonb_build_object('challan_no', c.challan_no, 'ground', _ground));
  return a;
end $$;

create or replace function public.review_appeal(_appeal_id uuid, _action text, _notes text default null)
returns public.appeals language plpgsql security definer set search_path = public as $$
declare a public.appeals; c public.challans; new_status public.appeal_status;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Forbidden'; end if;
  select * into a from public.appeals where id = _appeal_id for update;
  if a.id is null then raise exception 'Appeal not found'; end if;
  select * into c from public.challans where id = a.challan_id for update;
  if _action = 'start_review' then
    if a.status <> 'SUBMITTED' then raise exception 'Invalid transition'; end if;
    new_status := 'UNDER_REVIEW';
    update public.challans set status = 'UNDER_REVIEW', updated_at = now() where id = c.id;
  elsif _action in ('approve','reject') then
    if a.status not in ('SUBMITTED','UNDER_REVIEW') then raise exception 'Invalid transition'; end if;
    if coalesce(trim(_notes),'') = '' then raise exception 'Decision notes are required'; end if;
    new_status := case when _action = 'approve' then 'APPROVED'::public.appeal_status else 'REJECTED'::public.appeal_status end;
    update public.challans set status = case when _action = 'approve' then 'RESOLVED'::public.challan_status else 'PENDING'::public.challan_status end,
      due_date = case when _action = 'reject' then greatest(due_date, current_date + 15) else due_date end, updated_at = now() where id = c.id;
  else raise exception 'Unknown action'; end if;
  update public.appeals set status = new_status, reviewer_id = auth.uid(), decision_notes = coalesce(_notes, decision_notes),
    decided_at = case when new_status in ('APPROVED','REJECTED') then now() else null end where id = a.id returning * into a;
  insert into public.appeal_events(appeal_id, status, actor_id, note) values (a.id, new_status, auth.uid(), _notes);
  perform public._notify(a.citizen_id, 'APPEAL_UPDATE', 'Appeal ' || replace(new_status::text,'_',' '), 'Challan ' || c.challan_no || coalesce(': ' || _notes, ''), '/challans/' || c.id);
  perform public._audit(case when new_status in ('APPROVED','REJECTED') then 'APPEAL_DECISION' else 'APPEAL_UPDATE' end, 'appeal', a.id::text, jsonb_build_object('challan_no', c.challan_no, 'status', new_status));
  return a;
end $$;

create or replace function public.run_escalation()
returns jsonb language plpgsql security definer set search_path = public as $$
declare s jsonb; rem int := 0; ov int := 0; esc int := 0; r record;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Forbidden'; end if;
  select value into s from public.system_settings where key = 'escalation';
  for r in select * from public.challans where status = 'PENDING' and reminder_sent_at is null and due_date - current_date <= coalesce((s->>'reminder_days_before_due')::int, 7) and due_date >= current_date loop
    update public.challans set reminder_sent_at = now() where id = r.id;
    perform public._notify(r.owner_id, 'PAYMENT_REMINDER', 'Payment reminder', r.challan_no || ' (₹' || r.amount || ') is due on ' || to_char(r.due_date,'DD Mon YYYY'), '/challans/' || r.id);
    rem := rem + 1;
  end loop;
  for r in update public.challans set status = 'OVERDUE', updated_at = now() where status = 'PENDING' and due_date < current_date returning * loop
    perform public._notify(r.owner_id, 'CHALLAN_OVERDUE', 'Challan overdue', r.challan_no || ' is past its due date.', '/challans/' || r.id);
    ov := ov + 1;
  end loop;
  for r in update public.challans set status = 'ESCALATED', updated_at = now() where status = 'OVERDUE' and due_date + coalesce((s->>'escalate_after_days_overdue')::int, 30) < current_date returning * loop
    perform public._notify(r.owner_id, 'CHALLAN_ESCALATED', 'Challan escalated', r.challan_no || ' has been escalated for follow-up by the authority.', '/challans/' || r.id);
    esc := esc + 1;
  end loop;
  perform public._audit('ESCALATION_RUN', 'system', null, jsonb_build_object('reminders', rem, 'overdue', ov, 'escalated', esc));
  return jsonb_build_object('reminders', rem, 'overdue', ov, 'escalated', esc);
end $$;

create or replace function public.refresh_document_reminders()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select * from public.document_expiry d where d.owner_id = auth.uid() and d.state in ('EXPIRING_SOON','EXPIRED') loop
    if not exists (select 1 from public.notifications where user_id = auth.uid() and type = 'DOC_EXPIRY' and link = '/vehicles/' || r.vehicle_id and body like r.doc || '%' and created_at > now() - interval '7 days') then
      perform public._notify(auth.uid(), 'DOC_EXPIRY', r.reg_no || ' document reminder',
        r.doc || case when r.days_left < 0 then ' expired ' || abs(r.days_left) || ' days ago.' else ' expires in ' || r.days_left || ' days.' end, '/vehicles/' || r.vehicle_id);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

create or replace function public.admin_set_role(_user_id uuid, _role public.app_role, _badge text default null, _station text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _user_id = auth.uid() and _role <> 'admin' then raise exception 'You cannot remove your own admin role'; end if;
  delete from public.user_roles where user_id = _user_id;
  insert into public.user_roles(user_id, role) values (_user_id, _role);
  if _role = 'officer' then
    insert into public.officers(user_id, badge_no, station) values (_user_id, coalesce(_badge, 'KL-' || substr(_user_id::text,1,6)), coalesce(_station,'Unassigned'))
    on conflict (user_id) do update set active = true, station = coalesce(_station, public.officers.station);
  else
    update public.officers set active = false where user_id = _user_id;
  end if;
  perform public._audit('USER_ROLE_CHANGE', 'user', _user_id::text, jsonb_build_object('role', _role));
end $$;

create or replace function public._audit_rule_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    perform public._audit(case when tg_op = 'INSERT' then 'RULE_CREATE' when tg_op = 'UPDATE' then 'RULE_UPDATE' else 'RULE_DELETE' end,
      tg_table_name, coalesce(new.id, old.id)::text, jsonb_build_object('op', tg_op));
  end if;
  return coalesce(new, old);
end $$;
create trigger audit_rules after insert or update or delete on public.traffic_rules for each row execute function public._audit_rule_change();
create trigger audit_penalties after insert or update or delete on public.violation_penalties for each row execute function public._audit_rule_change();
create trigger audit_violations after insert or update or delete on public.traffic_violations for each row execute function public._audit_rule_change();

create or replace function public.verify_challan(_challan_no text)
returns table(challan_no text, reg_no_masked text, violation text, amount int, issued_at timestamptz, status public.challan_status, verified_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.challan_no,
    left(v.reg_no, 4) || repeat('•', greatest(length(v.reg_no) - 6, 0)) || right(v.reg_no, 2),
    tv.name, c.amount, c.issued_at, c.status, now()
  from public.challans c join public.vehicles v on v.id = c.vehicle_id join public.traffic_violations tv on tv.id = c.violation_id
  where c.challan_no = upper(trim(_challan_no))
$$;
grant execute on function public.verify_challan(text) to anon, authenticated;

create policy "evidence staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and public.is_staff(auth.uid()) and (storage.foldername(name))[1] <> 'appeals');
create policy "appeal attachment upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = 'appeals' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "evidence read" on storage.objects for select to authenticated using (
  bucket_id = 'evidence' and (
    public.is_staff(auth.uid())
    or ((storage.foldername(name))[1] = 'appeals' and (storage.foldername(name))[2] = auth.uid()::text)
    or exists (select 1 from public.challans c where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid())
  ));

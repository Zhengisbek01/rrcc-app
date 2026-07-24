-- =========================================================
-- СХЕМА БД: Контроль оплат и закрывающих документов
-- Выполнить целиком в Vercel Dashboard -> Storage -> ваша БД -> Query
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- ПОЛЬЗОВАТЕЛИ (своя авторизация, без Supabase Auth) ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  role text not null check (role in ('site_manager','director','accountant')),
  telegram_chat_id text,
  telegram_link_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- ---------- ОБЪЕКТЫ ----------
create table if not exists objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  is_active boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- ---------- ПОДРЯДЧИКИ ----------
create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  bin text,
  created_at timestamptz not null default now()
);

-- ---------- ЗАЯВКИ НА ОПЛАТУ ----------
create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references objects(id),
  contractor_id uuid not null references contractors(id),
  amount numeric(14,2) not null check (amount > 0),
  invoice_photo_url text,
  purpose text not null,
  responsible_user_id uuid not null references users(id),
  created_by uuid not null references users(id),
  status text not null default 'pending_director'
    check (status in ('created','pending_director','approved','rejected','paid','awaiting_documents','closed')),

  decided_by uuid references users(id),
  decided_at timestamptz,
  decision_comment text,

  paid_at date,
  paid_amount numeric(14,2),

  required_documents text[] default '{}',
  document_deadline date,
  documents_received boolean not null default false,
  documents_received_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pr_status on payment_requests(status);
create index if not exists idx_pr_object on payment_requests(object_id);
create index if not exists idx_pr_responsible on payment_requests(responsible_user_id);
create index if not exists idx_pr_created_by on payment_requests(created_by);

create or replace view payment_requests_view as
select
  pr.*,
  o.name as object_name,
  c.name as contractor_name,
  resp.full_name as responsible_name,
  creator.full_name as created_by_name,
  decider.full_name as decided_by_name,
  case
    when pr.documents_received then 'documents_received'
    when pr.document_deadline is not null and pr.document_deadline < current_date and not pr.documents_received then 'documents_overdue'
    when pr.document_deadline is not null then 'documents_pending'
    else null
  end as documents_status
from payment_requests pr
join objects o on o.id = pr.object_id
join contractors c on c.id = pr.contractor_id
join users resp on resp.id = pr.responsible_user_id
join users creator on creator.id = pr.created_by
left join users decider on decider.id = pr.decided_by;

-- ---------- УВЕДОМЛЕНИЯ ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text not null,
  payment_request_id uuid references payment_requests(id),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notif_user on notifications(user_id, is_read);

begin;

create table if not exists athone_private.ledger_codes (
  account_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$')
);

create table if not exists athone_private.ledger_devices (
  device_id uuid primary key references auth.users (id) on delete cascade,
  account_id uuid not null references athone_private.ledger_codes (account_id) on delete cascade
);

alter table athone_private.ledger_codes enable row level security;
alter table athone_private.ledger_devices enable row level security;
revoke all on athone_private.ledger_codes, athone_private.ledger_devices from public, anon, authenticated;

create or replace function public.athone_linked_ledger()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.account_id
  from athone_private.ledger_devices as d
  where d.device_id = auth.uid();
$$;

create or replace function public.athone_link_device(sync_hash text, create_ledger boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  device uuid := auth.uid();
  account uuid;
  linked_account uuid;
begin
  if device is null then
    raise exception 'Device session required.' using errcode = '42501';
  end if;
  if sync_hash is null or sync_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid sync code.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(device::text, 1));
  select d.account_id into linked_account from athone_private.ledger_devices as d
  where d.device_id = device;

  if create_ledger then
    if linked_account is not null and linked_account <> device then
      raise exception 'This device is already linked to another ledger.';
    end if;
    insert into athone_private.ledger_codes (account_id, code_hash) values (device, sync_hash)
      on conflict (account_id) do nothing;
  end if;

  select c.account_id into account from athone_private.ledger_codes as c
  where c.code_hash = sync_hash;

  if account is null or (create_ledger and account <> device) then
    raise exception 'Sync code wasn''t found.';
  end if;
  if linked_account is not null and linked_account <> account then
    raise exception 'This device is already linked to another ledger.';
  end if;

  insert into athone_private.ledger_devices (device_id, account_id) values (device, account)
    on conflict (device_id) do nothing;
  return account;
end;
$$;

revoke all on function public.athone_linked_ledger() from public, anon, authenticated;
revoke all on function public.athone_link_device(text, boolean) from public, anon, authenticated;
grant execute on function public.athone_linked_ledger() to authenticated;
grant execute on function public.athone_link_device(text, boolean) to authenticated;

create or replace function public.athone_sync_ledger(
  target_account uuid,
  change_id uuid default null,
  changes jsonb default '[]'::jsonb,
  import_only boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry jsonb;
  entry_kind text;
  entry_id text;
  entry_value jsonb;
begin
  if auth.uid() is null or (
    auth.uid() is distinct from target_account
    and not exists (
      select 1 from athone_private.ledger_devices as device
      where device.device_id = auth.uid() and device.account_id = target_account
    )
  ) then
    raise exception 'The account does not match the signed-in user.' using errcode = '42501';
  end if;

  -- Serialize each account so a mutation and the returned snapshot agree.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_account::text, 0));

  if change_id is not null then
    insert into athone_private.applied_changes values (target_account, change_id)
    on conflict do nothing;

    if found then
      for entry in select value from pg_catalog.jsonb_array_elements(changes) loop
        entry_kind := entry->>'kind';
        entry_id := entry->>'id';
        entry_value := nullif(entry->'value', 'null'::jsonb);

        if entry_kind in ('expense', 'income') and entry_value is not null and (
          pg_catalog.jsonb_typeof(entry_value) is distinct from 'object'
          or entry_value->>'id' is distinct from entry_id
          or pg_catalog.jsonb_typeof(entry_value->'amount') is distinct from 'number'
          or coalesce(entry_value->>'date', '') !~ '^\d{4}-\d{2}-\d{2}$'
        ) then
          raise exception 'Invalid transaction';
        end if;

        if entry_kind = 'setting' and (
          not (entry_id in ('currency', 'monthlyBudget') or entry_id like 'cap:%')
          or (entry_id = 'currency' and pg_catalog.jsonb_typeof(entry_value) is distinct from 'string')
          or (entry_id <> 'currency' and pg_catalog.jsonb_typeof(entry_value) is distinct from 'number')
        ) then
          raise exception 'Invalid budget setting';
        end if;

        -- A deletion leaves a tombstone so an old local import cannot revive it.
        insert into athone_private.ledger_records values (target_account, entry_kind, entry_id, entry_value)
        on conflict (account_id, kind, record_id) do update
          set value = excluded.value
          where not import_only;
      end loop;
    end if;
  end if;

  return coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'kind', r.kind, 'id', r.record_id, 'value', r.value
    ))
    from athone_private.ledger_records as r
    where r.account_id = target_account and r.value is not null
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.athone_sync_ledger(uuid, uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.athone_sync_ledger(uuid, uuid, jsonb, boolean) to authenticated;

commit;

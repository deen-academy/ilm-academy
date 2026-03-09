-- Ensure required extensions exist
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 1) Notify students when a new lesson is created
-- (Function public.notify_new_lesson() already exists in this project)
drop trigger if exists trg_notify_new_lesson on public.lessons;
create trigger trg_notify_new_lesson
after insert on public.lessons
for each row
execute function public.notify_new_lesson();

-- 2) Notify students shortly before a live class starts (scheduled reminders)
create or replace function public.send_upcoming_live_class_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  _request_id bigint;
begin
  -- Lock matching rows to avoid double-sends if the function overlaps
  for r in
    select id, title, scheduled_at, course_id
    from public.live_classes
    where reminder_sent = false
      and scheduled_at <= now() + interval '10 minutes'
      and scheduled_at > now()
    for update skip locked
  loop
    select net.http_post(
      url := 'https://vafdtneevznngwblirpl.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZmR0bmVldnpubmd3YmxpcnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDg2NTUsImV4cCI6MjA4ODUyNDY1NX0.J9fPb-1oph8DuX-Dgk30e7fZ4Xyc2UvQAWTrL4QynJg'
      ),
      body := jsonb_build_object(
        'title', 'Live Class Starting Soon',
        'body', '"' || r.title || '" starts at ' || to_char(r.scheduled_at at time zone 'UTC', 'Mon DD at HH24:MI') || ' UTC',
        'course_id', r.course_id,
        'url', '/courses'
      )
    ) into _request_id;

    update public.live_classes
      set reminder_sent = true
      where id = r.id;
  end loop;
end;
$$;

-- Run every minute (idempotent)
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'live-class-reminders-every-minute') then
    perform cron.schedule(
      'live-class-reminders-every-minute',
      '* * * * *',
      'select public.send_upcoming_live_class_reminders();'
    );
  end if;
end
$$;
-- Fix database linter warnings: set immutable search_path on SECURITY DEFINER functions

create or replace function public.notify_new_lesson()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _course_id uuid;
  _course_title text;
  _request_id bigint;
begin
  select m.course_id, c.title into _course_id, _course_title
  from public.modules m
  join public.courses c on c.id = m.course_id
  where m.id = new.module_id;

  if _course_id is not null then
    select net.http_post(
      url := 'https://vafdtneevznngwblirpl.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZmR0bmVldnpubmd3YmxpcnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDg2NTUsImV4cCI6MjA4ODUyNDY1NX0.J9fPb-1oph8DuX-Dgk30e7fZ4Xyc2UvQAWTrL4QynJg'
      ),
      body := jsonb_build_object(
        'title', 'New Lesson Added!',
        'body', 'A new lesson "' || new.title || '" has been added to ' || _course_title,
        'course_id', _course_id,
        'url', '/courses/' || _course_id
      )
    ) into _request_id;
  end if;

  return new;
end;
$$;

create or replace function public.notify_new_live_class()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _request_id bigint;
begin
  select net.http_post(
    url := 'https://vafdtneevznngwblirpl.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZmR0bmVldnpubmd3YmxpcnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDg2NTUsImV4cCI6MjA4ODUyNDY1NX0.J9fPb-1oph8DuX-Dgk30e7fZ4Xyc2UvQAWTrL4QynJg'
    ),
    body := jsonb_build_object(
      'title', 'Live Class Scheduled!',
      'body', '"' || new.title || '" is scheduled for ' || to_char(new.scheduled_at at time zone 'UTC', 'Mon DD at HH24:MI') || ' UTC',
      'course_id', new.course_id,
      'url', '/courses'
    )
  ) into _request_id;

  return new;
end;
$$;
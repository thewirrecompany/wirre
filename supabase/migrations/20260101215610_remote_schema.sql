drop extension if exists "pg_net";


  create table "public"."assessment_audits" (
    "id" uuid not null default gen_random_uuid(),
    "assessment_id" uuid,
    "actor_id" uuid,
    "actor_role" text,
    "action" text not null,
    "details" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."assessment_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "assessment_id" uuid,
    "recipient_role" text not null,
    "message" text,
    "payload" jsonb,
    "read_by" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."assessment_registrations" (
    "id" uuid not null default gen_random_uuid(),
    "assessment_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."assessment_registrations" enable row level security;


  create table "public"."assessments" (
    "id" uuid not null default gen_random_uuid(),
    "company_user_id" uuid not null,
    "title" text,
    "github_repo" text,
    "status" text not null default 'draft'::text,
    "github_classroom_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "has_repo_access" boolean default false,
    "payment_confirmed" boolean default false,
    "payment_amount" numeric default 0,
    "payment_confirmed_at" timestamp with time zone,
    "technologies" jsonb,
    "duration_minutes" integer,
    "start_at" timestamp with time zone,
    "positions" integer default 1,
    "min_salary" numeric,
    "max_salary" numeric,
    "assignment_level" text,
    "assignment_mode" text,
    "description" text,
    "github_repo_owner" text,
    "github_repo_name" text,
    "github_repo_verified" boolean default false,
    "github_installation_id" text,
    "github_repo_verified_at" timestamp with time zone
      );


alter table "public"."assessments" enable row level security;


  create table "public"."candidates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "full_name" text not null,
    "github_username" text,
    "created_at" timestamp with time zone default now(),
    "linkedin_url" text
      );


alter table "public"."candidates" enable row level security;


  create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "domain" text,
    "linkedin_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."companies" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "role" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."waitlist" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "role" text not null,
    "created_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX assessment_audits_pkey ON public.assessment_audits USING btree (id);

CREATE UNIQUE INDEX assessment_notifications_pkey ON public.assessment_notifications USING btree (id);

CREATE UNIQUE INDEX assessment_registrations_assessment_id_user_id_key ON public.assessment_registrations USING btree (assessment_id, user_id);

CREATE UNIQUE INDEX assessment_registrations_pkey ON public.assessment_registrations USING btree (id);

CREATE UNIQUE INDEX assessments_pkey ON public.assessments USING btree (id);

CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id);

CREATE UNIQUE INDEX candidates_user_id_key ON public.candidates USING btree (user_id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX companies_user_id_key ON public.companies USING btree (user_id);

CREATE INDEX idx_assessment_audits_assessment_id ON public.assessment_audits USING btree (assessment_id);

CREATE INDEX idx_assessment_notifications_recipient_role ON public.assessment_notifications USING btree (recipient_role);

CREATE INDEX idx_assessments_has_repo_access ON public.assessments USING btree (has_repo_access);

CREATE INDEX idx_assessments_payment_confirmed ON public.assessments USING btree (payment_confirmed);

CREATE INDEX idx_assessments_repo_path ON public.assessments USING btree (github_repo_owner, github_repo_name);

CREATE INDEX idx_assessments_start_at ON public.assessments USING btree (start_at);

CREATE INDEX idx_assessments_status ON public.assessments USING btree (status);

CREATE INDEX idx_assessments_technologies ON public.assessments USING gin (technologies);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX waitlist_pkey ON public.waitlist USING btree (id);

alter table "public"."assessment_audits" add constraint "assessment_audits_pkey" PRIMARY KEY using index "assessment_audits_pkey";

alter table "public"."assessment_notifications" add constraint "assessment_notifications_pkey" PRIMARY KEY using index "assessment_notifications_pkey";

alter table "public"."assessment_registrations" add constraint "assessment_registrations_pkey" PRIMARY KEY using index "assessment_registrations_pkey";

alter table "public"."assessments" add constraint "assessments_pkey" PRIMARY KEY using index "assessments_pkey";

alter table "public"."candidates" add constraint "candidates_pkey" PRIMARY KEY using index "candidates_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."waitlist" add constraint "waitlist_pkey" PRIMARY KEY using index "waitlist_pkey";

alter table "public"."assessment_audits" add constraint "assessment_audits_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE not valid;

alter table "public"."assessment_audits" validate constraint "assessment_audits_assessment_id_fkey";

alter table "public"."assessment_notifications" add constraint "assessment_notifications_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE not valid;

alter table "public"."assessment_notifications" validate constraint "assessment_notifications_assessment_id_fkey";

alter table "public"."assessment_registrations" add constraint "assessment_registrations_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE not valid;

alter table "public"."assessment_registrations" validate constraint "assessment_registrations_assessment_id_fkey";

alter table "public"."assessment_registrations" add constraint "assessment_registrations_assessment_id_user_id_key" UNIQUE using index "assessment_registrations_assessment_id_user_id_key";

alter table "public"."assessment_registrations" add constraint "assessment_registrations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."assessment_registrations" validate constraint "assessment_registrations_user_id_fkey";

alter table "public"."candidates" add constraint "candidates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."candidates" validate constraint "candidates_user_id_fkey";

alter table "public"."candidates" add constraint "candidates_user_id_key" UNIQUE using index "candidates_user_id_key";

alter table "public"."companies" add constraint "companies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."companies" validate constraint "companies_user_id_fkey";

alter table "public"."companies" add constraint "companies_user_id_key" UNIQUE using index "companies_user_id_key";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['company'::text, 'candidate'::text, 'admin'::text, 'superadmin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."waitlist" add constraint "waitlist_role_check" CHECK ((role = ANY (ARRAY['candidate'::text, 'company'::text]))) not valid;

alter table "public"."waitlist" validate constraint "waitlist_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.candidate_finish_assessment(p_assessment_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_exists boolean;
  v_count int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  select exists(
    select 1 from assessment_registrations where assessment_id = p_assessment_id and user_id = auth.uid()
  ) into v_exists;

  if not v_exists then
    raise exception 'not registered for assessment';
  end if;

  -- mark the assessment as completed
  update assessments set status = 'completed' where id = p_assessment_id;
  get diagnostics v_count = row_count;

  return json_build_object('updated', v_count);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.company_delete_assessment(p_assessment_id uuid, p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count int := 0;
  v_exists boolean;
BEGIN
  IF auth.uid() IS NULL OR (auth.uid()::uuid <> p_user_id AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT EXISTS(SELECT 1 FROM assessments WHERE id = p_assessment_id AND company_user_id = p_user_id AND status = 'ready' AND (start_at IS NULL OR start_at > now())) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'assessment not found or not deletable';
  END IF;

  DELETE FROM assessments WHERE id = p_assessment_id;
  GET DIAGNOSTICS v_count = row_count;

  RETURN json_build_object('deleted', v_count);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.company_delete_self(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count int := 0;
BEGIN
  IF auth.uid() IS NULL OR (auth.uid()::uuid <> p_user_id AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- delete upcoming assessments (status='ready' and start_at in future)
  DELETE FROM assessments
  WHERE company_user_id = p_user_id AND status = 'ready' AND (start_at IS NULL OR start_at > now());

  GET DIAGNOSTICS deleted_count = row_count;

  -- delete the company record (and cascade other related rows if configured)
  DELETE FROM companies WHERE user_id = p_user_id;

  RETURN json_build_object('deleted_upcoming_assessments', deleted_count);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'candidate')
  );
  
  -- If it's a company, create the company record automatically
  IF (new.raw_user_meta_data->>'role' = 'company') THEN
    INSERT INTO public.companies (user_id, name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'New Company'));
  -- If it's a candidate, create the candidate record automatically
  ELSE
    INSERT INTO public.candidates (user_id, full_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'New Candidate'));
  END IF;

  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND (role = 'admin' OR role = 'superadmin')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_assessment_owned_by(p_user uuid, p_assessment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.assessments
    WHERE id = p_assessment_id AND company_user_id = p_user
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'superadmin'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_due_assessments_started()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update assessments
  set status = 'started'
  where status = 'ready' and start_at is not null and start_at <= now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_assessment_start_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (NEW.start_at IS NOT NULL) AND (NEW.start_at < now() + interval '3 days') THEN
    RAISE EXCEPTION 'start_at must be at least 3 days in the future';
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."assessment_audits" to "anon";

grant insert on table "public"."assessment_audits" to "anon";

grant references on table "public"."assessment_audits" to "anon";

grant select on table "public"."assessment_audits" to "anon";

grant trigger on table "public"."assessment_audits" to "anon";

grant truncate on table "public"."assessment_audits" to "anon";

grant update on table "public"."assessment_audits" to "anon";

grant delete on table "public"."assessment_audits" to "authenticated";

grant insert on table "public"."assessment_audits" to "authenticated";

grant references on table "public"."assessment_audits" to "authenticated";

grant select on table "public"."assessment_audits" to "authenticated";

grant trigger on table "public"."assessment_audits" to "authenticated";

grant truncate on table "public"."assessment_audits" to "authenticated";

grant update on table "public"."assessment_audits" to "authenticated";

grant delete on table "public"."assessment_audits" to "service_role";

grant insert on table "public"."assessment_audits" to "service_role";

grant references on table "public"."assessment_audits" to "service_role";

grant select on table "public"."assessment_audits" to "service_role";

grant trigger on table "public"."assessment_audits" to "service_role";

grant truncate on table "public"."assessment_audits" to "service_role";

grant update on table "public"."assessment_audits" to "service_role";

grant delete on table "public"."assessment_notifications" to "anon";

grant insert on table "public"."assessment_notifications" to "anon";

grant references on table "public"."assessment_notifications" to "anon";

grant select on table "public"."assessment_notifications" to "anon";

grant trigger on table "public"."assessment_notifications" to "anon";

grant truncate on table "public"."assessment_notifications" to "anon";

grant update on table "public"."assessment_notifications" to "anon";

grant delete on table "public"."assessment_notifications" to "authenticated";

grant insert on table "public"."assessment_notifications" to "authenticated";

grant references on table "public"."assessment_notifications" to "authenticated";

grant select on table "public"."assessment_notifications" to "authenticated";

grant trigger on table "public"."assessment_notifications" to "authenticated";

grant truncate on table "public"."assessment_notifications" to "authenticated";

grant update on table "public"."assessment_notifications" to "authenticated";

grant delete on table "public"."assessment_notifications" to "service_role";

grant insert on table "public"."assessment_notifications" to "service_role";

grant references on table "public"."assessment_notifications" to "service_role";

grant select on table "public"."assessment_notifications" to "service_role";

grant trigger on table "public"."assessment_notifications" to "service_role";

grant truncate on table "public"."assessment_notifications" to "service_role";

grant update on table "public"."assessment_notifications" to "service_role";

grant delete on table "public"."assessment_registrations" to "anon";

grant insert on table "public"."assessment_registrations" to "anon";

grant references on table "public"."assessment_registrations" to "anon";

grant select on table "public"."assessment_registrations" to "anon";

grant trigger on table "public"."assessment_registrations" to "anon";

grant truncate on table "public"."assessment_registrations" to "anon";

grant update on table "public"."assessment_registrations" to "anon";

grant delete on table "public"."assessment_registrations" to "authenticated";

grant insert on table "public"."assessment_registrations" to "authenticated";

grant references on table "public"."assessment_registrations" to "authenticated";

grant select on table "public"."assessment_registrations" to "authenticated";

grant trigger on table "public"."assessment_registrations" to "authenticated";

grant truncate on table "public"."assessment_registrations" to "authenticated";

grant update on table "public"."assessment_registrations" to "authenticated";

grant delete on table "public"."assessment_registrations" to "service_role";

grant insert on table "public"."assessment_registrations" to "service_role";

grant references on table "public"."assessment_registrations" to "service_role";

grant select on table "public"."assessment_registrations" to "service_role";

grant trigger on table "public"."assessment_registrations" to "service_role";

grant truncate on table "public"."assessment_registrations" to "service_role";

grant update on table "public"."assessment_registrations" to "service_role";

grant delete on table "public"."assessments" to "anon";

grant insert on table "public"."assessments" to "anon";

grant references on table "public"."assessments" to "anon";

grant select on table "public"."assessments" to "anon";

grant trigger on table "public"."assessments" to "anon";

grant truncate on table "public"."assessments" to "anon";

grant update on table "public"."assessments" to "anon";

grant delete on table "public"."assessments" to "authenticated";

grant insert on table "public"."assessments" to "authenticated";

grant references on table "public"."assessments" to "authenticated";

grant select on table "public"."assessments" to "authenticated";

grant trigger on table "public"."assessments" to "authenticated";

grant truncate on table "public"."assessments" to "authenticated";

grant update on table "public"."assessments" to "authenticated";

grant delete on table "public"."assessments" to "service_role";

grant insert on table "public"."assessments" to "service_role";

grant references on table "public"."assessments" to "service_role";

grant select on table "public"."assessments" to "service_role";

grant trigger on table "public"."assessments" to "service_role";

grant truncate on table "public"."assessments" to "service_role";

grant update on table "public"."assessments" to "service_role";

grant delete on table "public"."candidates" to "anon";

grant insert on table "public"."candidates" to "anon";

grant references on table "public"."candidates" to "anon";

grant select on table "public"."candidates" to "anon";

grant trigger on table "public"."candidates" to "anon";

grant truncate on table "public"."candidates" to "anon";

grant update on table "public"."candidates" to "anon";

grant delete on table "public"."candidates" to "authenticated";

grant insert on table "public"."candidates" to "authenticated";

grant references on table "public"."candidates" to "authenticated";

grant select on table "public"."candidates" to "authenticated";

grant trigger on table "public"."candidates" to "authenticated";

grant truncate on table "public"."candidates" to "authenticated";

grant update on table "public"."candidates" to "authenticated";

grant delete on table "public"."candidates" to "service_role";

grant insert on table "public"."candidates" to "service_role";

grant references on table "public"."candidates" to "service_role";

grant select on table "public"."candidates" to "service_role";

grant trigger on table "public"."candidates" to "service_role";

grant truncate on table "public"."candidates" to "service_role";

grant update on table "public"."candidates" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."waitlist" to "anon";

grant insert on table "public"."waitlist" to "anon";

grant references on table "public"."waitlist" to "anon";

grant select on table "public"."waitlist" to "anon";

grant trigger on table "public"."waitlist" to "anon";

grant truncate on table "public"."waitlist" to "anon";

grant update on table "public"."waitlist" to "anon";

grant delete on table "public"."waitlist" to "authenticated";

grant insert on table "public"."waitlist" to "authenticated";

grant references on table "public"."waitlist" to "authenticated";

grant select on table "public"."waitlist" to "authenticated";

grant trigger on table "public"."waitlist" to "authenticated";

grant truncate on table "public"."waitlist" to "authenticated";

grant update on table "public"."waitlist" to "authenticated";

grant delete on table "public"."waitlist" to "service_role";

grant insert on table "public"."waitlist" to "service_role";

grant references on table "public"."waitlist" to "service_role";

grant select on table "public"."waitlist" to "service_role";

grant trigger on table "public"."waitlist" to "service_role";

grant truncate on table "public"."waitlist" to "service_role";

grant update on table "public"."waitlist" to "service_role";


  create policy "Admins can read registrations"
  on "public"."assessment_registrations"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Candidates can delete own registration"
  on "public"."assessment_registrations"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Candidates can insert own registration"
  on "public"."assessment_registrations"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Candidates can read own registrations"
  on "public"."assessment_registrations"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Companies can read registrations for their assessments"
  on "public"."assessment_registrations"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR public.is_assessment_owned_by(auth.uid(), assessment_id)));



  create policy "Admins can delete assessments"
  on "public"."assessments"
  as permissive
  for delete
  to authenticated
using (public.is_admin(auth.uid()));



  create policy "Admins can view all assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using (public.is_admin(auth.uid()));



  create policy "Companies and admins can update assessments"
  on "public"."assessments"
  as permissive
  for update
  to authenticated
using (((company_user_id = auth.uid()) OR public.is_admin(auth.uid())))
with check ((((company_user_id = auth.uid()) OR public.is_admin(auth.uid())) AND ((start_at IS NULL) OR (start_at >= (now() + '3 days'::interval)))));



  create policy "Companies can insert assessments"
  on "public"."assessments"
  as permissive
  for insert
  to authenticated
with check (((company_user_id = auth.uid()) AND ((start_at IS NULL) OR (start_at >= (now() + '3 days'::interval)))));



  create policy "Company owner can view own assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using ((company_user_id = auth.uid()));



  create policy "Owners and admins can delete assessments"
  on "public"."assessments"
  as permissive
  for delete
  to authenticated
using (((company_user_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Owners and admins can insert assessments"
  on "public"."assessments"
  as permissive
  for insert
  to authenticated
with check ((((company_user_id = auth.uid()) OR public.is_admin(auth.uid())) AND ((start_at IS NULL) OR (start_at >= (now() + '3 days'::interval)))));



  create policy "Owners and admins can update assessments"
  on "public"."assessments"
  as permissive
  for update
  to authenticated
using (((company_user_id = auth.uid()) OR public.is_admin(auth.uid())))
with check ((((company_user_id = auth.uid()) OR public.is_admin(auth.uid())) AND ((start_at IS NULL) OR (start_at >= (now() + '3 days'::interval)))));



  create policy "Owners and admins can view assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using (((company_user_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Public ready assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using ((status = 'ready'::text));



  create policy "Registered assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.assessment_registrations ar
  WHERE ((ar.assessment_id = assessments.id) AND (ar.user_id = auth.uid())))));



  create policy "Registered/Owner/Admin can view assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.assessment_registrations ar
  WHERE ((ar.assessment_id = assessments.id) AND (ar.user_id = auth.uid())))) OR (company_user_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Superadmins can view all assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using (public.is_superadmin(auth.uid()));



  create policy "Admins can update candidates"
  on "public"."candidates"
  as permissive
  for update
  to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));



  create policy "Allow authenticated users to insert own candidate record"
  on "public"."candidates"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Candidates and admins can view candidates"
  on "public"."candidates"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Candidates can read own data"
  on "public"."candidates"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Candidates can update own data"
  on "public"."candidates"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Superadmins can view all candidates"
  on "public"."candidates"
  as permissive
  for select
  to authenticated
using (public.is_superadmin(auth.uid()));



  create policy "Admins can update companies"
  on "public"."companies"
  as permissive
  for update
  to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));



  create policy "Allow authenticated users to insert own company record"
  on "public"."companies"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Companies and admins can view companies"
  on "public"."companies"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Companies can delete own data"
  on "public"."companies"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Companies can read own data"
  on "public"."companies"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Companies can update own data"
  on "public"."companies"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Superadmins can view all companies"
  on "public"."companies"
  as permissive
  for select
  to authenticated
using (public.is_superadmin(auth.uid()));



  create policy "Admins and superadmins can update profiles"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((public.is_admin(auth.uid()) OR public.is_superadmin(auth.uid())))
with check ((public.is_admin(auth.uid()) OR public.is_superadmin(auth.uid())));



  create policy "Delete profile by role"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using (((auth.uid() = id) OR (public.is_admin(auth.uid()) AND (id <> auth.uid()) AND ((role = 'candidate'::text) OR (role = 'company'::text))) OR public.is_superadmin(auth.uid())));



  create policy "Superadmins can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (public.is_superadmin(auth.uid()));



  create policy "Users and admins can view profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (((id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Users can read own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER tr_validate_start_at BEFORE INSERT OR UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.validate_assessment_start_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



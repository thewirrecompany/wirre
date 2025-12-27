


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."candidate_finish_assessment"("p_assessment_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."candidate_finish_assessment"("p_assessment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."company_delete_assessment"("p_assessment_id" "uuid", "p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."company_delete_assessment"("p_assessment_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."company_delete_self"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."company_delete_self"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_candidate_signup"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_github_username" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_candidate_id uuid;
BEGIN
  -- Ensure profile exists and has correct role
  INSERT INTO public.profiles (id, email, role)
  VALUES (p_user_id, p_email, 'candidate')
  ON CONFLICT (id) DO UPDATE SET role = 'candidate';
  
  -- Create candidate record
  INSERT INTO public.candidates (user_id, full_name, github_username)
  VALUES (p_user_id, p_full_name, p_github_username)
  RETURNING id INTO v_candidate_id;
  
  RETURN json_build_object('candidate_id', v_candidate_id);
END;
$$;


ALTER FUNCTION "public"."complete_candidate_signup"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_github_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_company_signup"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_domain" "text" DEFAULT NULL::"text", "p_linkedin_url" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Ensure profile exists and has correct role
  INSERT INTO public.profiles (id, email, role)
  VALUES (p_user_id, p_email, 'company')
  ON CONFLICT (id) DO UPDATE SET role = 'company';
  
  -- Create company record
  INSERT INTO public.companies (user_id, name, domain, linkedin_url)
  VALUES (p_user_id, p_name, p_domain, p_linkedin_url)
  RETURNING id INTO v_company_id;
  
  RETURN json_build_object('company_id', v_company_id);
END;
$$;


ALTER FUNCTION "public"."complete_company_signup"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_domain" "text", "p_linkedin_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'candidate');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_due_assessments_started"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update assessments
  set status = 'started'
  where status = 'ready' and start_at is not null and start_at <= now();
end;
$$;


ALTER FUNCTION "public"."mark_due_assessments_started"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assessment_audits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "actor_id" "uuid",
    "actor_role" "text",
    "action" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_audits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "recipient_role" "text" NOT NULL,
    "message" "text",
    "payload" "jsonb",
    "read_by" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_user_id" "uuid" NOT NULL,
    "title" "text",
    "github_repo" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "github_classroom_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_repo_access" boolean DEFAULT false,
    "payment_confirmed" boolean DEFAULT false,
    "payment_amount" numeric DEFAULT 0,
    "payment_confirmed_at" timestamp with time zone,
    "technologies" "jsonb",
    "duration_minutes" integer,
    "start_at" timestamp with time zone,
    "positions" integer DEFAULT 1,
    "min_salary" numeric,
    "max_salary" numeric,
    "assignment_level" "text",
    "assignment_mode" "text"
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "github_username" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linkedin_url" "text"
);


ALTER TABLE "public"."candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text",
    "linkedin_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['company'::"text", 'candidate'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "waitlist_role_check" CHECK (("role" = ANY (ARRAY['candidate'::"text", 'company'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assessment_audits"
    ADD CONSTRAINT "assessment_audits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_notifications"
    ADD CONSTRAINT "assessment_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_registrations"
    ADD CONSTRAINT "assessment_registrations_assessment_id_user_id_key" UNIQUE ("assessment_id", "user_id");



ALTER TABLE ONLY "public"."assessment_registrations"
    ADD CONSTRAINT "assessment_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assessment_audits_assessment_id" ON "public"."assessment_audits" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_notifications_recipient_role" ON "public"."assessment_notifications" USING "btree" ("recipient_role");



CREATE INDEX "idx_assessments_has_repo_access" ON "public"."assessments" USING "btree" ("has_repo_access");



CREATE INDEX "idx_assessments_payment_confirmed" ON "public"."assessments" USING "btree" ("payment_confirmed");



CREATE INDEX "idx_assessments_start_at" ON "public"."assessments" USING "btree" ("start_at");



CREATE INDEX "idx_assessments_status" ON "public"."assessments" USING "btree" ("status");



CREATE INDEX "idx_assessments_technologies" ON "public"."assessments" USING "gin" ("technologies");



ALTER TABLE ONLY "public"."assessment_audits"
    ADD CONSTRAINT "assessment_audits_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_notifications"
    ADD CONSTRAINT "assessment_notifications_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_registrations"
    ADD CONSTRAINT "assessment_registrations_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_registrations"
    ADD CONSTRAINT "assessment_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete assessments" ON "public"."assessments" FOR DELETE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can read registrations" ON "public"."assessment_registrations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update candidates" ON "public"."candidates" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update companies" ON "public"."companies" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Allow authenticated users to insert own candidate record" ON "public"."candidates" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to insert own company record" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Candidates and admins can view candidates" ON "public"."candidates" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Candidates can delete own registration" ON "public"."assessment_registrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Candidates can insert own registration" ON "public"."assessment_registrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Candidates can read own data" ON "public"."candidates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Candidates can read own registrations" ON "public"."assessment_registrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Candidates can update own data" ON "public"."candidates" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Companies and admins can update assessments" ON "public"."assessments" FOR UPDATE TO "authenticated" USING ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))) WITH CHECK ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Companies and admins can view companies" ON "public"."companies" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Companies can delete own data" ON "public"."companies" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Companies can insert assessments" ON "public"."assessments" FOR INSERT TO "authenticated" WITH CHECK (("company_user_id" = "auth"."uid"()));



CREATE POLICY "Companies can read own data" ON "public"."companies" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Companies can read registrations for their assessments" ON "public"."assessment_registrations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "assessment_registrations"."assessment_id") AND ("assessments"."company_user_id" = "auth"."uid"())))));



CREATE POLICY "Companies can update own data" ON "public"."companies" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Company owner can view own assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING (("company_user_id" = "auth"."uid"()));



CREATE POLICY "Owners and admins can delete assessments" ON "public"."assessments" FOR DELETE TO "authenticated" USING ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Owners and admins can insert assessments" ON "public"."assessments" FOR INSERT TO "authenticated" WITH CHECK ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Owners and admins can update assessments" ON "public"."assessments" FOR UPDATE TO "authenticated" USING ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))) WITH CHECK ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Owners and admins can view assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING ((("company_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Public ready assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING (("status" = 'ready'::"text"));



CREATE POLICY "Users and admins can view profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Users can delete own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."assessment_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."candidate_finish_assessment"("p_assessment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."candidate_finish_assessment"("p_assessment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."candidate_finish_assessment"("p_assessment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."company_delete_assessment"("p_assessment_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."company_delete_assessment"("p_assessment_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."company_delete_assessment"("p_assessment_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."company_delete_self"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."company_delete_self"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."company_delete_self"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_candidate_signup"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_github_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_candidate_signup"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_github_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_candidate_signup"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_github_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_company_signup"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_domain" "text", "p_linkedin_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_company_signup"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_domain" "text", "p_linkedin_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_company_signup"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_domain" "text", "p_linkedin_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_due_assessments_started"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_due_assessments_started"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_due_assessments_started"() TO "service_role";


















GRANT ALL ON TABLE "public"."assessment_audits" TO "anon";
GRANT ALL ON TABLE "public"."assessment_audits" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_audits" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_notifications" TO "anon";
GRANT ALL ON TABLE "public"."assessment_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_registrations" TO "anon";
GRANT ALL ON TABLE "public"."assessment_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."candidates" TO "anon";
GRANT ALL ON TABLE "public"."candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."candidates" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































-- Allow a registered candidate to mark an assessment as completed (SECURITY DEFINER)
create or replace function public.candidate_finish_assessment(p_assessment_id uuid)
returns json as $$
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
$$ language plpgsql security definer;

grant execute on function public.candidate_finish_assessment to authenticated;

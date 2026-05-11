import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type Round = {
  id: string;
  title: string;
  status: string;
  start_at: string | null;
  duration_minutes: number | null;
  positions: number | null;
  company_user_id: string;
  created_at: string;
  is_paid: boolean;
  emergency_abandoned: boolean;
  is_sample: boolean;
  company: string;
  peer_review_skipped?: boolean;
};

export type CandidateRoundsData = {
  activeRounds: Round[];
  completedRounds: Round[];
  upcomingRounds: Round[];
};

export async function fetchCandidateRounds(userId: string): Promise<CandidateRoundsData> {
  // Trigger RPC calls and fetch registrations in parallel
  const [, , { data: regs, error: regsErr }] = await Promise.all([
    Promise.resolve(supabase.rpc('mark_due_assessments_started')),
    Promise.resolve(supabase.rpc('auto_complete_expired_assessments')),
    supabase
      .from('assessment_registrations')
      .select('assessment_id,created_at,access_granted,coding_finished_at,peer_review_assigned_at,peer_review_skipped')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  let registeredAssessments: any[] = [];
  const accessGrantedMap: Record<string, boolean> = {};
  const registrationDataMap: Record<string, any> = {};

  if (!regsErr && regs && regs.length > 0) {
    const ids = Array.from(new Set(regs.map((r: any) => r.assessment_id)));
    regs.forEach((r: any) => {
      accessGrantedMap[r.assessment_id] = r.access_granted;
      registrationDataMap[r.assessment_id] = r;
    });

    const { data: asses } = await supabase
      .from('assessments')
      .select('id,title,status,start_at,duration_minutes,positions,company_user_id,created_at,is_paid,emergency_abandoned,is_sample')
      .in('id', ids as any[])
      .order('created_at', { ascending: false });
    registeredAssessments = asses || [];
  }

  // Fetch company names for all referenced companies
  const allCompanyIds = Array.from(new Set(registeredAssessments.map((a: any) => a.company_user_id).filter(Boolean)));
  let companiesMap: Record<string, string> = {};
  if (allCompanyIds.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('user_id,name')
      .in('user_id', allCompanyIds as any[]);
    if (companies) {
      companiesMap = Object.fromEntries((companies as any[]).map(c => [c.user_id, c.name]));
    }
  }

  const now = new Date();

  const upcomingRegistered = registeredAssessments.filter((a: any) =>
    a.status === 'ready' && a.start_at && new Date(a.start_at) > now
  );

  const completed = registeredAssessments.filter((a: any) => {
    if (upcomingRegistered.includes(a)) return false;
    const reg = registrationDataMap[a.id];
    if (a.status === 'completed') return true;
    if (reg?.peer_review_skipped) return true;
    if (a.is_sample) return false;
    if (a.start_at && a.duration_minutes) {
      const endTime = new Date(new Date(a.start_at).getTime() + (a.duration_minutes + 60) * 60000);
      if (now > endTime) return true;
    }
    return false;
  });

  const active = registeredAssessments.filter(
    (a: any) => !upcomingRegistered.includes(a) && !completed.includes(a)
  );

  const enrich = (arr: any[]) =>
    arr.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' }));

  return {
    upcomingRounds: enrich(upcomingRegistered),
    activeRounds: enrich(active),
    completedRounds: enrich(completed),
  };
}

export function useCandidateRounds(userId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-rounds', userId],
    queryFn: () => fetchCandidateRounds(userId!),
    enabled: !!userId,
    // Rounds are time-sensitive, don't cache too long
    staleTime: 5_000,
  });
}

export function prefetchCandidateRounds(userId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['candidate-rounds', userId],
    queryFn: () => fetchCandidateRounds(userId),
    staleTime: 5_000,
  });
}

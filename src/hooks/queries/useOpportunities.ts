import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type OpportunitiesData = {
  opportunities: any[];
  profileIncomplete: boolean;
};

export async function fetchOpportunities(userId: string): Promise<OpportunitiesData> {
  // Kick off RPC + load all data in parallel
  const [, { data: candidateData }, { data: assessmentData, error }] = await Promise.all([
    Promise.resolve(supabase.rpc('mark_due_assessments_started')),
    supabase
      .from('candidates')
      .select('github_username, linkedin_url')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('assessments')
      .select('id,title,company_user_id,created_at,technologies,duration_minutes,start_at,positions,is_paid')
      .eq('status', 'ready')
      .order('created_at', { ascending: false }),
  ]);

  if (error) throw error;

  const profileIncomplete = !(candidateData?.github_username && candidateData?.linkedin_url);
  const assessments = assessmentData || [];

  // Fetch companies + registrations in parallel
  const userIds = Array.from(new Set(assessments.map((a: any) => a.company_user_id).filter(Boolean)));
  const [companiesRes, regsRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from('companies').select('user_id,name,domain').in('user_id', userIds as any[])
      : Promise.resolve({ data: [] }),
    supabase.from('assessment_registrations').select('assessment_id').eq('user_id', userId),
  ]);

  const companiesMap: Record<string, any> = Object.fromEntries(
    ((companiesRes.data as any[]) || []).map(c => [c.user_id, { name: c.name, domain: c.domain }])
  );
  const registeredIds = ((regsRes.data as any[]) || []).map((r: any) => r.assessment_id);

  const opportunities = assessments
    .filter((a: any) => !registeredIds.includes(a.id))
    .map((a: any) => ({
      ...a,
      company: companiesMap[a.company_user_id] || { name: 'Unknown', domain: '' },
    }));

  return { opportunities, profileIncomplete };
}

export function useOpportunities(userId: string | undefined) {
  return useQuery({
    queryKey: ['opportunities', userId],
    queryFn: () => fetchOpportunities(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function prefetchOpportunities(userId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['opportunities', userId],
    queryFn: () => fetchOpportunities(userId),
    staleTime: 30_000,
  });
}

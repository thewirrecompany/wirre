import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type CompanyDashboardData = {
  assessments: any[];
  upcomingCount: number;
  activeAssessmentsCount: number;
  pastAssessmentsCount: number;
  activeRolesCount: number;
  totalCandidates: number;
  submissionsCount: number;
  hasWebsite: boolean;
};

export async function fetchCompanyDashboard(ownerId: string): Promise<CompanyDashboardData> {
  // Fetch assessments and company profile in parallel
  const [{ data: aData, error: aErr }, { data: cData }] = await Promise.all([
    supabase
      .from('assessments')
      .select('id,title,positions,created_at,status,start_at,payment_confirmed,is_paid')
      .eq('company_user_id', ownerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('companies')
      .select('domain')
      .eq('user_id', ownerId)
      .single(),
  ]);

  if (aErr) throw aErr;
  const aList = aData || [];

  const assessmentIds = aList.map((a: any) => a.id).filter(Boolean);

  // Compute statuses
  const now = new Date();
  const upcoming = aList.filter((a: any) =>
    a.status !== 'completed' && a.start_at && new Date(a.start_at) > now
  ).length;
  const activeAss = aList.filter((a: any) => a.status === 'published').length;
  const pastAss = aList.filter((a: any) => a.status === 'completed').length;

  // Fetch registrations + audits in parallel
  let regs: any[] = [];
  let audits: any[] = [];

  if (assessmentIds.length > 0) {
    const [{ data: rData }, { data: aAudits }] = await Promise.all([
      supabase
        .from('assessment_registrations')
        .select('assessment_id,user_id')
        .in('assessment_id', assessmentIds as any[]),
      supabase
        .from('assessment_audits')
        .select('assessment_id')
        .in('assessment_id', assessmentIds as any[])
        .eq('action', 'submission'),
    ]);
    regs = rData || [];
    audits = aAudits || [];
  }

  const regsByAssessment: Record<string, number> = {};
  const uniqueCandidates = new Set<string>();
  regs.forEach(r => {
    regsByAssessment[r.assessment_id] = (regsByAssessment[r.assessment_id] || 0) + 1;
    if (r.user_id) uniqueCandidates.add(r.user_id);
  });

  const submissionsByAssessment: Record<string, number> = {};
  audits.forEach(x => {
    submissionsByAssessment[x.assessment_id] = (submissionsByAssessment[x.assessment_id] || 0) + 1;
  });

  const enriched = aList.map((a: any) => ({
    ...a,
    registrationsCount: regsByAssessment[a.id] || 0,
    submissionsCount: submissionsByAssessment[a.id] || 0,
  }));

  const activeRoles = aList
    .filter((a: any) => a.status !== 'completed' && a.is_paid)
    .reduce((sum: number, a: any) => sum + (a.positions || 0), 0);

  return {
    assessments: enriched,
    upcomingCount: upcoming,
    activeAssessmentsCount: activeAss,
    pastAssessmentsCount: pastAss,
    activeRolesCount: activeRoles,
    totalCandidates: uniqueCandidates.size,
    submissionsCount: audits.length,
    hasWebsite: !!cData?.domain,
  };
}

export function useCompanyDashboard(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['company-dashboard', ownerId],
    queryFn: () => fetchCompanyDashboard(ownerId!),
    enabled: !!ownerId,
  });
}

/** Call this on nav link hover to preload data before the user even clicks */
export function prefetchCompanyDashboard(ownerId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['company-dashboard', ownerId],
    queryFn: () => fetchCompanyDashboard(ownerId),
  });
}

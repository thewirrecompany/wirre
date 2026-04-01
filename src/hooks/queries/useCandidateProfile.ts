import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type CandidateProfileData = {
  full_name: string;
  username: string;
  is_public: boolean;
  email: string;
  github_username: string;
  linkedin_url: string;
  date_of_birth: string;
  hasActiveRounds: boolean;
};

export async function fetchCandidateProfile(userId: string): Promise<CandidateProfileData> {
  // All three queries run in parallel
  const [{ data: profileRow }, { data: candidateRow }, { data: currentRegs }] = await Promise.all([
    supabase.from('profiles').select('email').eq('id', userId).single(),
    supabase
      .from('candidates')
      .select('full_name, username, is_public, github_username, linkedin_url, date_of_birth')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('assessment_registrations')
      .select('assessment_id, coding_finished_at, assessments(start_at, duration_minutes, emergency_abandoned, is_sample)')
      .eq('user_id', userId),
  ]);

  let hasActiveRounds = false;
  if (currentRegs) {
    const now = Date.now();
    hasActiveRounds = currentRegs.some((reg: any) => {
      if (reg.coding_finished_at) return false;
      const assessment = reg.assessments;
      if (!assessment) return false;
      if (assessment.emergency_abandoned) return false;
      if (assessment.is_sample) return false;
      if (!assessment.start_at) return false;
      const start = new Date(assessment.start_at).getTime();
      const end = start + assessment.duration_minutes * 60 * 1000;
      return now >= start && now <= end;
    });
  }

  return {
    full_name: candidateRow?.full_name || '',
    username: candidateRow?.username || '',
    is_public: candidateRow?.is_public ?? false,
    email: profileRow?.email || '',
    github_username: candidateRow?.github_username || '',
    linkedin_url: candidateRow?.linkedin_url || '',
    date_of_birth: candidateRow?.date_of_birth || '',
    hasActiveRounds,
  };
}

export function useCandidateProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-profile', userId],
    queryFn: () => fetchCandidateProfile(userId!),
    enabled: !!userId,
  });
}

export function prefetchCandidateProfile(userId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['candidate-profile', userId],
    queryFn: () => fetchCandidateProfile(userId),
  });
}

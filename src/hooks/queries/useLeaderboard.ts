import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  fullName?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  totalScore: number;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  assessmentTitle: string | null;
};

export async function fetchLeaderboard(id?: string): Promise<LeaderboardData> {
  // Call the optimized RPC function
  const { data: entries, error } = await supabase.rpc('get_leaderboard', {
    p_assessment_id: id || null
  });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  // Get assessment title if id is provided
  let assessmentTitle: string | null = null;
  if (id) {
    const { data: asm } = await supabase
      .from('assessments')
      .select('title')
      .eq('id', id)
      .single();
    if (asm) assessmentTitle = asm.title;
  }

  // Map RPC result to LeaderboardEntry type
  const mappedEntries: LeaderboardEntry[] = (entries || []).map((entry: any) => ({
    rank: Number(entry.rank),
    username: entry.username || 'Anonymous',
    fullName: entry.is_public ? entry.full_name : undefined,
    githubUsername: entry.is_public ? entry.github_username : undefined,
    linkedinUrl: entry.is_public ? entry.linkedin_url : undefined,
    totalScore: Number(entry.total_score),
  }));

  return { entries: mappedEntries, assessmentTitle };
}

export function useLeaderboard(id?: string) {
  return useQuery({
    queryKey: ['leaderboard', id ?? 'global'],
    queryFn: () => fetchLeaderboard(id),
    // Leaderboard doesn't change that often — 2 min cache
    staleTime: 2 * 60_000,
  });
}

export function prefetchLeaderboard(id?: string) {
  return queryClient.prefetchQuery({
    queryKey: ['leaderboard', id ?? 'global'],
    queryFn: () => fetchLeaderboard(id),
    staleTime: 2 * 60_000,
  });
}

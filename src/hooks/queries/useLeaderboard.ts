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
  let candidateScores: Record<string, { total: number; user_id: string }> = {};
  let assessmentTitle: string | null = null;

  if (id) {
    // Fetch title and scores in parallel
    const [{ data: asm }, { data: regs, error: regErr }] = await Promise.all([
      supabase.from('assessments').select('title').eq('id', id).single(),
      supabase
        .from('assessment_registrations')
        .select('user_id, score')
        .eq('assessment_id', id)
        .not('score', 'is', null),
    ]);

    if (regErr) throw regErr;
    if (asm) assessmentTitle = asm.title;

    (regs || []).forEach(reg => {
      if (reg.score !== null) {
        if (!candidateScores[reg.user_id]) {
          candidateScores[reg.user_id] = { total: 0, user_id: reg.user_id };
        }
        candidateScores[reg.user_id].total += reg.score;
      }
    });
  } else {
    const { data: regs, error: regErr } = await supabase
      .from('assessment_registrations')
      .select('user_id, score')
      .not('score', 'is', null);

    if (regErr) throw regErr;

    (regs || []).forEach(reg => {
      if (reg.score !== null) {
        if (!candidateScores[reg.user_id]) {
          candidateScores[reg.user_id] = { total: 0, user_id: reg.user_id };
        }
        candidateScores[reg.user_id].total += reg.score;
      }
    });
  }

  const userIds = Object.keys(candidateScores);
  if (userIds.length === 0) return { entries: [], assessmentTitle };

  const { data: cands, error: candErr } = await supabase
    .from('candidates')
    .select('user_id, username, full_name, github_username, linkedin_url, is_public')
    .in('user_id', userIds);

  if (candErr) throw candErr;

  const leaderboard: LeaderboardEntry[] = (cands || []).map(cand => {
    const isPublic = cand.is_public === true;
    return {
      rank: 0,
      username: cand.username || 'Anonymous',
      fullName: isPublic ? cand.full_name : undefined,
      githubUsername: isPublic ? cand.github_username : undefined,
      linkedinUrl: isPublic ? cand.linkedin_url : undefined,
      totalScore: candidateScores[cand.user_id].total,
    };
  });

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  let currentRank = 1;
  for (let i = 0; i < leaderboard.length; i++) {
    if (i > 0 && leaderboard[i].totalScore < leaderboard[i - 1].totalScore) {
      currentRank = i + 1;
    }
    leaderboard[i].rank = currentRank;
  }

  return { entries: leaderboard, assessmentTitle };
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

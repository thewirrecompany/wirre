import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Profile, type Candidate } from '@/lib/supabase';
import CandidateRounds from '@/pages/candidate/Rounds';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ViewAsCandidate() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch candidate
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (candidateError) throw candidateError;

      setProfile(profileData);
      setCandidate(candidateData);
    } catch (error) {
      console.error('Error loading candidate data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading candidate view...</p>
      </div>
    );
  }

  if (!candidate || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Candidate not found</p>
          <Button onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin header - fixed below main header */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-b border-primary/30 py-2 px-4 shadow-2xl">
        <div className="container max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/dashboard')}
              className="h-8 w-8 rounded-none border-primary/40 hover:bg-primary/10 transition-colors shrink-0"
              title="Back to Admin"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest opacity-70 shrink-0">Acting As</span>
                <p className="text-xs font-mono font-bold uppercase truncate tracking-tight">{candidate.full_name}</p>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground truncate opacity-50 lowercase">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-[9px] font-mono border border-primary/20 px-2 py-0.5 rounded-none opacity-50 uppercase tracking-widest">
              Proxy Session
            </div>
            <div className="text-[10px] bg-primary text-black px-3 py-1 font-mono font-black tracking-tighter uppercase">
              ADMIN
            </div>
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed admin header */}
      <div className="pt-12">
        <CandidateRounds userId={profile.id} embedded={true} />
      </div>
    </div>
  );
}

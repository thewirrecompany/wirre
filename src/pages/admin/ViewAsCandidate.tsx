import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Profile, type Candidate } from '@/lib/supabase';
import CandidateDashboard from '@/pages/candidate/Dashboard';
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
      <div className="fixed top-14 left-0 right-0 z-40 bg-background border-b border-primary p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
            <div>
              <p className="text-sm font-medium">Editing as: {candidate.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-mono">
            ADMIN MODE
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed admin header */}
      <div className="pt-[73px]">
        <CandidateDashboard candidateUserId={profile.id} />
      </div>
    </div>
  );
}

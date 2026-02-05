import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AssessmentDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [showDeleteReposConfirm, setShowDeleteReposConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deletingRepos, setDeletingRepos] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
        if (error) throw error;
        if (!mounted) return;
        setAssessment(data);

        if (data?.company_user_id) {
          try {
            const { data: c } = await supabase.from('companies').select('name').eq('user_id', data.company_user_id).single();
            if (c) setCompanyName((c as any).name || '');
          } catch (e) { /* ignore */ }
        }

        // load registrants with anonymous IDs
        const { data: regs } = await supabase
          .from('assessment_registrations')
          .select('user_id, created_at, anonymous_id, repo_provisioned, access_granted')
          .eq('assessment_id', id);

        // Organizers should ONLY see anonymous IDs, not real names/usernames
        setRegistrants(regs || []);
      } catch (err: any) {
        console.error('Error loading assessment detail:', err);
        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleDelete = async () => {
    if (!assessment || !profile?.id) return;
    const regsCount = registrants.length;
    if (regsCount >= 1) {
      const ok = window.confirm(`This assessment has ${regsCount} participant(s). Deleting it will charge ₹1000 (simulation). Proceed?`);
      if (!ok) return;
      toast({ title: 'Payment required', description: 'Charging ₹1000 (simulation).' });
      await new Promise(r => setTimeout(r, 800));
    } else {
      const ok = window.confirm('Delete this upcoming assessment? This cannot be undone.');
      if (!ok) return;
    }

    try {
      const { error } = await supabase.rpc('company_delete_assessment', { p_assessment_id: id, p_user_id: profile.id });
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Assessment removed.' });
      navigate('/company/dashboard');
    } catch (err: any) {
      console.error('Delete failed', err);
      toast({ title: 'Delete failed', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const canDeleteRepos = (() => {
    if (!assessment?.start_at || !assessment?.duration_minutes) return false;
    try {
      const start = new Date(assessment.start_at).getTime();
      const end = start + (assessment.duration_minutes * 60 * 1000);
      const fifteenDaysAfterEnd = end + (15 * 24 * 60 * 60 * 1000);
      return Date.now() >= fifteenDaysAfterEnd;
    } catch (e) {
      return false;
    }
  })();

  const assessmentHasStarted = (() => {
    if (!assessment?.start_at) return false;
    try {
      const start = new Date(assessment.start_at).getTime();
      return Date.now() >= start;
    } catch (e) {
      return false;
    }
  })();

  const handleDeleteReposClick = () => {
    setShowDeleteReposConfirm(true);
  };

  const handleFirstConfirm = () => {
    setShowDeleteReposConfirm(false);
    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = async () => {
    setShowFinalConfirm(false);
    setDeletingRepos(true);
    try {
      const { error } = await supabase.functions.invoke('delete-candidate-repos', {
        body: { assessmentId: id }
      });

      if (error) throw error;

      toast({
        title: 'Repos Deleted',
        description: 'All candidate repositories have been permanently deleted.',
      });
    } catch (err: any) {
      console.error('Failed to delete repos:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete repositories',
        variant: 'destructive'
      });
    } finally {
      setDeletingRepos(false);
    }
  };

  if (loading) return <Layout><div className="py-24 container">Loading...</div></Layout>;
  if (!assessment) return <Layout><div className="py-24 container">Assessment not found</div></Layout>;

  // Edit disabled 1 day before start
  const editDisabled = (() => {
    if (!assessment?.start_at) return false;
    try {
      const start = new Date(assessment.start_at).getTime();
      const cutoff = start - 24 * 60 * 60 * 1000; // one day before
      return Date.now() >= cutoff;
    } catch (e) {
      return false;
    }
  })();

  // Delete disabled 1 week before start
  const deleteDisabled = (() => {
    if (!assessment?.start_at) return false;
    try {
      const start = new Date(assessment.start_at).getTime();
      const cutoff = start - 7 * 24 * 60 * 60 * 1000; // one week before
      return Date.now() >= cutoff;
    } catch (e) {
      return false;
    }
  })();

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container px-4 md:px-6 max-w-4xl">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight mb-2 uppercase">{assessment.title}</h1>
            <p className="text-xs md:text-sm text-muted-foreground font-mono tracking-widest">{companyName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border border-border p-6 bg-card/30 rounded-sm">
              <h3 className="font-mono font-bold mb-4 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Details</h3>
              <div className="space-y-3">
                {assessment.is_paid && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Positions</span>
                    <span className="font-mono text-xs md:text-sm font-bold">{assessment.positions || 1}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Start</span>
                  <span className="font-mono text-xs md:text-sm">{assessment.start_at ? new Date(assessment.start_at).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Duration</span>
                  <span className="font-mono text-xs md:text-sm">{assessment.duration_minutes ? `${assessment.duration_minutes} min` : '—'}</span>
                </div>
                {assessment.is_paid && (() => {
                  const min = (assessment as any).min_salary ?? (assessment as any).minSalary;
                  const max = (assessment as any).max_salary ?? (assessment as any).maxSalary;
                  if (min == null && max == null) return null;
                  const fmt = (v: any) => {
                    try {
                      return Number(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
                    } catch (e) { return String(v); }
                  };
                  return (
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Salary</span>
                      <span className="font-mono text-xs md:text-sm">{min != null ? fmt(min) : '—'}{max != null ? ` — ${fmt(max)}` : ''}</span>
                    </div>
                  );
                })()}
                <div className="flex flex-col gap-1 pb-2">
                  <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Technologies</span>
                  <span className="font-mono text-xs md:text-sm">{(assessment.technologies || []).join(', ')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Status</span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase h-5">
                    {assessment.status === 'awaiting_classroom_setup' ? 'waiting for admin' : assessment.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border border-border p-6 bg-card/30 rounded-sm">
              <h3 className="font-mono font-bold mb-4 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Participants ({registrants.length})</h3>
              <p className="text-[10px] text-muted-foreground mb-6 italic leading-relaxed">
                Candidates are anonymous during evaluation. Identities revealed only after you select for interviews.
              </p>
              {registrants.length === 0 ? (
                <div className="flex items-center justify-center py-8 border border-dashed border-border rounded-sm">
                  <p className="text-xs text-muted-foreground font-mono">No participants yet</p>
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-3">
                  {registrants.map((r) => (
                    <div key={r.user_id} className="font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-background/50 border border-border/50 rounded-sm">
                      <span className="font-bold text-primary">{r.anonymous_id || 'CAND-PENDING'}</span>
                      <div className="flex gap-2 text-[10px] text-muted-foreground overflow-x-auto whitespace-nowrap">
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        {r.repo_provisioned && <span className="text-green-500">Repo ✓</span>}
                        {r.access_granted && <span className="text-green-500">Access ✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <Button
              onClick={async () => {
                if (!id) return;
                // Check if assessment is finalized
                const { data: assessmentData } = await supabase
                  .from('assessments')
                  .select('identities_revealed')
                  .eq('id', id)
                  .single();

                if (assessmentData?.identities_revealed) {
                  // Get all selected candidates
                  const { data: selectedRegs } = await supabase
                    .from('assessment_registrations')
                    .select('anonymous_id')
                    .eq('assessment_id', id)
                    .eq('selection_status', 'selected');

                  const selectedIds = selectedRegs?.map(r => r.anonymous_id).join(',') || '';
                  navigate(`/company/assessments/${id}/selection-review?selected=${selectedIds}`);
                } else {
                  navigate(`/company/assessments/${id}/submissions`);
                }
              }}
              variant="default"
              className="font-mono w-full sm:w-auto h-11"
              disabled={!assessmentHasStarted}
              title={!assessmentHasStarted ? "Submissions visible after round starts" : "View submissions"}
            >
              View Submissions
            </Button>
            <Button
              onClick={() => { if (id) navigate(`/company/assessments/${id}/edit?paid=${assessment.is_paid}`); }}
              disabled={editDisabled}
              title={editDisabled ? 'Editing locked 1 day before start' : 'Edit assessment'}
              variant="outline"
              className="font-mono w-full sm:w-auto h-11"
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDisabled}
              className="font-mono w-full sm:w-auto h-11"
              title={deleteDisabled ? 'Deleting locked 1 week before start' : 'Delete assessment'}
            >
              Delete Assessment
            </Button>
            {canDeleteRepos && (
              <Button
                variant="outline"
                onClick={handleDeleteReposClick}
                disabled={deletingRepos}
                className="font-mono w-full sm:w-auto h-11 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                {deletingRepos ? 'Deleting Repos...' : 'Delete All Candidate Repos'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* First Confirmation Modal */}
      {showDeleteReposConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">⚠️ Delete All Candidate Repositories?</h3>
            <div className="space-y-3 mb-6 text-sm">
              <p className="text-muted-foreground">
                This will permanently delete all {registrants.length} candidate repositories for this assessment.
              </p>
              <p className="text-amber-500 font-semibold">
                This action cannot be undone.
              </p>
              <p className="text-muted-foreground">
                We recommend doing this only after you have selected your candidates.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteReposConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleFirstConfirm}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirmation Modal */}
      {showFinalConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-500">🚨 Final Confirmation</h3>
            <div className="space-y-3 mb-6 text-sm">
              <p className="font-semibold">
                Are you absolutely sure you want to delete all candidate repositories?
              </p>
              <p className="text-muted-foreground">
                All code, commits, and history will be permanently lost.
              </p>
              <p className="text-red-500 font-bold">
                THIS CANNOT BE REVERSED.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowFinalConfirm(false)}>
                No, Keep Repos
              </Button>
              <Button variant="destructive" onClick={handleFinalConfirm}>
                Yes, Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AssessmentSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [repoVerified, setRepoVerified] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  async function loadAssessment() {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
    if (error) {
      console.error('Error loading assessment:', error);
      setLoading(false);
      return;
    }
    setAssessment(data);
    if (data?.github_repo_owner && data?.github_repo_name) {
      setRepoInput(`${data.github_repo_owner}/${data.github_repo_name}`);
      setRepoVerified(data.github_repo_verified || false);
    }
    setLoading(false);
  }

  async function handleVerifyRepo() {
    if (!repoInput.includes('/')) {
      toast({ title: 'Invalid format', description: 'Repository must be in owner/name format', variant: 'destructive' });
      return;
    }

    const [owner, repo] = repoInput.split('/');
    setVerifying(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-repo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ owner, repo })
      });

      const data = await res.json();

      if (data.ok) {
        setRepoVerified(true);
        toast({ title: 'Repository verified', description: `WIRRE can access ${repoInput}` });

        // Update assessment with verified repo
        const { error } = await supabase
          .from('assessments')
          .update({
            github_repo_owner: owner,
            github_repo_name: repo,
            github_repo_verified: true
          })
          .eq('id', id);

        if (error) throw error;
        loadAssessment();
      } else {
        setRepoVerified(false);
        toast({ title: 'Verification failed', description: data.error || 'Cannot access repository', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleSave() {
    if (!id) return;
    setLoading(true);

    let error: any = null;

    if (assessment?.is_sample) {
      // Use SECURITY DEFINER RPC to bypass RLS/trigger constraints for sample rounds
      const { error: rpcError } = await supabase.rpc('mark_sample_round_ready', {
        p_assessment_id: id
      });
      error = rpcError;
    } else {
      // Normal round: direct update
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', id);
      error = updateError;
    }

    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      console.error('Error updating assessment:', error);
      setLoading(false);
      return;
    }

    toast({ title: 'Saved', description: 'Assessment is ready for candidate registration.' });
    setLoading(false);
    navigate('/admin/dashboard');
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Assessment not found</p>
            <Button onClick={() => navigate('/admin/dashboard')} className="mt-4">Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const startTime = assessment.start_at ? new Date(assessment.start_at) : null;
  const hasStarted = startTime && new Date() >= startTime;

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-3xl">
          <h1 className="text-2xl font-bold mb-4">Assessment Setup</h1>
          {hasStarted && (
            <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ This assessment has started. Repository cannot be edited.
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-6">
            When candidates register, WIRRE will automatically create a private fork of this repository for each candidate.
            They'll work on their fork and submit via Pull Request for automated evaluation.
          </p>

          <div className="mb-6">
            <Label className="font-mono text-xs mb-2 block">Template Repository</Label>
            {!editingRepo ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1 p-3 border border-border font-mono bg-secondary/30">
                  {assessment.github_repo_owner}/{assessment.github_repo_name || '—'}
                  {repoVerified && <span className="ml-2 text-green-600 text-xs">✓ Verified</span>}
                </div>
                {!hasStarted && (
                  <Button size="sm" variant="outline" onClick={() => setEditingRepo(true)}>
                    Edit
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="owner/repository"
                  value={repoInput}
                  onChange={(e) => {
                    setRepoInput(e.target.value);
                    setRepoVerified(false);
                  }}
                  className="font-mono"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleVerifyRepo} disabled={verifying || !repoInput.includes('/')}>
                    {verifying ? 'Verifying...' : 'Verify Access'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditingRepo(false);
                    setRepoInput(`${assessment.github_repo_owner}/${assessment.github_repo_name}`);
                    setRepoVerified(assessment.github_repo_verified || false);
                  }}>
                    Cancel
                  </Button>
                </div>
                {repoVerified && (
                  <p className="text-xs text-green-600">✓ Repository verified and saved</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              This is the organizer's repository that will be used as the template for candidate assessments.
            </p>
          </div>

          <div className="mb-6 p-4 border border-border bg-secondary/10">
            <h3 className="font-mono text-sm font-bold mb-2">Workflow Overview</h3>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside font-mono">
              <li>Candidate registers for this assessment</li>
              <li>WIRRE bot creates a private fork for the candidate</li>
              <li>Candidate clones, creates a branch, and implements solution</li>
              <li>Candidate pushes branch and opens a Pull Request</li>
              <li>WIRRE bot evaluates the PR and provides automated feedback</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>Mark as Ready</Button>
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>Cancel</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

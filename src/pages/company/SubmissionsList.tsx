import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, CheckCircle, XCircle, Bot, Play, Loader2 } from 'lucide-react';

export default function SubmissionsList() {
  const { id } = useParams(); // assessment ID
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showRealIdentities, setShowRealIdentities] = useState(false);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('submissions-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments', filter: `id=eq.${id}` }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_registrations' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Load all submissions (registrations with repos)
      const { data: registrations, error: regError } = await supabase
        .from('assessment_registrations')
        .select('id, anonymous_id, user_id, repo_provisioned, access_granted, created_at, score, selection_status, ai_score, ai_peer_review_score, ai_grading_status')
        .eq('assessment_id', id)
        .eq('repo_provisioned', true);

      if (regError) throw regError;

      // If showing real identities, fetch candidate info
      if (showRealIdentities && registrations) {
        const userIds = registrations.map(r => r.user_id);
        const [candidatesRes, profilesRes] = await Promise.all([
          supabase
            .from('candidates')
            .select('user_id, full_name, github_username')
            .in('user_id', userIds),
          supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds)
        ]);

        const candidatesMap = new Map(candidatesRes.data?.map(c => [c.user_id, c]) || []);
        const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);

        setSubmissions(registrations.map(r => ({
          ...r,
          candidate: candidatesMap.get(r.user_id),
          profile: profilesMap.get(r.user_id)
        })));
      } else {
        setSubmissions(registrations || []);
      }

    } catch (error: any) {
      console.error('Error loading submissions:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAll = async () => {
    const selectedSubmissions = submissions.filter(s => s.selection_status === 'selected');
    if (selectedSubmissions.length === 0) {
      toast({
        title: 'No candidates selected',
        description: 'Please select at least one candidate before finalizing',
        variant: 'destructive'
      });
      return;
    }

    const selectedIds = selectedSubmissions.map(s => s.anonymous_id).join(',');
    navigate(`/company/assessments/${id}/selection-review?selected=${selectedIds}`);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    if (submissions.length === 0) {
      toast({
        title: 'No submissions',
        description: 'There are no submissions to download.',
        variant: 'destructive'
      });
      return;
    }

    setDownloading(true);
    try {
      // Dynamically load JSZip from CDN
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
      const zip = new JSZip();

      toast({
        title: 'Downloading...',
        description: `Fetching ${submissions.length} submissions. Please wait.`
      });

      for (const submission of submissions) {
        const folderName = submission.anonymous_id;
        const folder = zip.folder(folderName);

        try {
          // Fetch repository contents
          const { data, error } = await supabase.functions.invoke('get-submission-code', {
            body: { assessmentId: id, anonymousId: submission.anonymous_id }
          });

          if (error || !data) {
            console.error(`Failed to fetch ${submission.anonymous_id}:`, error);
            folder?.file('ERROR.txt', `Failed to fetch submission: ${error?.message || 'Unknown error'}`);
            continue;
          }

          // Recursively add files to the folder
          await addFilesToZip(folder, data, id!, submission.anonymous_id);
        } catch (err: any) {
          console.error(`Error fetching ${submission.anonymous_id}:`, err);
          folder?.file('ERROR.txt', `Error: ${err.message}`);
        }
      }

      // Generate and download the zip
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assessment?.title || 'submissions'}-all.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: `Downloaded ${submissions.length} submissions as ZIP.`
      });
    } catch (err: any) {
      console.error('Download failed:', err);
      toast({
        title: 'Download Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };



  // Helper to recursively add files to zip folder
  const addFilesToZip = async (folder: any, items: any[], assessmentId: string, anonymousId: string) => {
    for (const item of items) {
      if (item.type === 'file') {
        // Fetch file content
        const { data } = await supabase.functions.invoke('get-submission-code', {
          body: { assessmentId, anonymousId, path: item.path }
        });
        if (data?.content) {
          // GitHub returns base64 encoded content
          try {
            const content = atob(data.content);
            folder.file(item.name, content);
          } catch {
            folder.file(item.name, data.content);
          }
        }
      } else if (item.type === 'dir') {
        // Create subfolder and fetch its contents
        const subFolder = folder.folder(item.name);
        const { data: subItems } = await supabase.functions.invoke('get-submission-code', {
          body: { assessmentId, anonymousId, path: item.path }
        });
        if (subItems && Array.isArray(subItems)) {
          await addFilesToZip(subFolder, subItems, assessmentId, anonymousId);
        }
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-24 container">Loading submissions...</div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <Layout>
        <div className="py-24 container">Assessment not found</div>
      </Layout>
    );
  }

  const assessmentEnded = assessment.start_at && assessment.duration_minutes
    ? new Date(assessment.start_at).getTime() + (assessment.duration_minutes * 60 * 1000) < Date.now()
    : false;

  const selectedCount = submissions.filter(s => s.selection_status === 'selected').length;
  // Removed maxSelections logic per user request

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container px-4 md:px-6 max-w-6xl">
          <div className="text-center md:text-left mb-8 md:mb-12">
            <h1 className="text-2xl md:text-4xl font-bold font-mono tracking-tight uppercase mb-3">{assessment.title}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-widest">
              <span>Submissions: {submissions.length}</span>
              <span className="hidden sm:inline">|</span>
              <span className={assessmentEnded ? "text-red-500" : "text-green-500"}>
                {assessmentEnded ? 'Round Ended' : 'Round Active'}
              </span>
              {assessment.is_paid && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <span>Positions: {assessment.positions || 1}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>Selections: {selectedCount}</span>
                </>
              )}
            </div>
          </div>

          {!assessmentEnded && (
            <div className="mb-6 p-4 md:p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
              <p className="text-[10px] md:text-xs font-mono text-yellow-500/80 leading-relaxed uppercase tracking-wider text-center md:text-left">
                ⚠️ Assessment phase is ACTIVE. candidates are still working. code updates may occur.
              </p>
            </div>
          )}

          {!assessment.is_paid && (
            <div className="mb-6 p-4 md:p-6 bg-secondary/10 border border-white/10 rounded-sm">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wide mb-1 text-muted-foreground">Practice Assessment</h3>
              <p className="text-[10px] md:text-xs font-mono text-muted-foreground leading-relaxed uppercase tracking-wider">
                This prevents identity reveal and candidate selection.<br className="hidden sm:inline" />
                To hire candidates, you must upgrade to a paid assessment.
              </p>
            </div>
          )}

          {selectedCount > 0 && (
            <div className={`mb-6 p-4 md:p-6 border rounded-sm ${selectedCount <= (assessment?.positions || 1)
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-blue-500/5 border-blue-500/20'}`}>
              <p className={`text-[10px] md:text-xs font-mono leading-relaxed uppercase tracking-wider text-center md:text-left ${selectedCount <= (assessment?.positions || 1)
                ? 'text-green-500/80'
                : 'text-blue-500/80'}`}>
                {selectedCount <= (assessment?.positions || 1)
                  ? `✓ ${selectedCount}/${assessment?.positions || 1} positions filled. Identities will be revealed on finalize.`
                  : `ℹ️ ${selectedCount} candidates selected (>${assessment?.positions || 1} positions). Proceeding to Round 2 (Anonymous).`}
              </p>
            </div>
          )}

          <div className="mb-8 flex flex-wrap justify-center md:justify-start gap-3">
            {assessment.is_paid && (
              <Button
                onClick={handleFinalizeAll}
                disabled={selectedCount === 0 || !assessmentEnded}
                className="w-full sm:w-auto font-mono text-sm h-12 px-8 uppercase tracking-widest"
                variant="default"
                title={!assessmentEnded ? 'Assessment must end before finalizing' : ''}
              >
                {selectedCount <= (assessment?.positions || 1)
                  ? `Reveal & Finalize (${selectedCount})`
                  : `Proceed to Round 2 (${selectedCount})`}
              </Button>
            )}



            <Button
              onClick={handleDownloadAll}
              disabled={downloading || submissions.length === 0}
              className="w-full sm:w-auto font-mono text-sm h-12 px-8 uppercase tracking-widest"
              variant="outline"
            >
              {downloading ? 'Downloading...' : `Download All (${submissions.length})`}
            </Button>
          </div>

          <div className="space-y-6">
            {submissions.length === 0 ? (
              <div className="py-20 md:py-32 border border-dashed border-border/50 text-center rounded-sm">
                <p className="text-xs md:text-sm text-muted-foreground font-mono uppercase tracking-widest">No candidates have started yet</p>
              </div>
            ) : (
              submissions.map((submission) => {
                const isSelected = submission.selection_status === 'selected';
                const isRejected = submission.selection_status === 'rejected';

                return (
                  <Card key={submission.id} className={`border-border/50 bg-card/10 rounded-sm transition-all hover:border-border ${isSelected ? 'border-primary/50' : ''}`}>
                    <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm md:text-base font-bold tracking-tight">{submission.anonymous_id}</span>
                          {isSelected && <Badge variant="default" className="text-[10px] h-5 uppercase tracking-widest">Selected</Badge>}
                          {isRejected && <Badge variant="destructive" className="text-[10px] h-5 uppercase tracking-widest">Discarded</Badge>}
                        </div>

                        <div className="flex items-center gap-3">
                          {(submission.ai_score !== null || submission.ai_peer_review_score !== null) && (
                            <div className="flex flex-col items-end mr-4">
                              <div className="flex items-center gap-1 text-purple-500">
                                <Bot className="h-3 w-3" />
                                <span className="text-[10px] font-mono uppercase font-bold">AI Score</span>
                              </div>
                              <span className="text-lg font-mono font-bold leading-none text-purple-500">
                                {submission.ai_score !== null && submission.ai_peer_review_score !== null
                                  ? ((submission.ai_score + submission.ai_peer_review_score) / 2)
                                  : (submission.ai_score ?? submission.ai_peer_review_score)}/10
                              </span>
                            </div>
                          )}

                          {submission.score !== null && submission.score !== undefined && (
                            <div className="flex flex-col items-end mr-2">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">Score</span>
                              <span className="text-lg font-mono font-bold leading-none">{submission.score}/10</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-mono text-[10px] h-9 px-4 uppercase tracking-wider flex-1 sm:flex-none"
                            onClick={() => navigate(`/company/assessments/${id}/submissions/${submission.anonymous_id}`)}
                          >
                            Review Code
                          </Button>
                        </div>
                      </div>

                      {showRealIdentities && submission.candidate && (
                        <div className="mt-4 pt-4 border-t border-border/50 bg-primary/5 p-4 rounded-sm">
                          <p className="text-sm font-bold font-mono uppercase text-primary">
                            {submission.candidate.full_name}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground font-mono mt-1">
                            @{submission.candidate.github_username} • {submission.profile?.email}
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 md:px-6 pb-4 md:pb-6 pt-0">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-t border-border/20 pt-4">
                        <span>Joined: {new Date(submission.created_at).toLocaleDateString('en-GB')}</span>
                        {submission.access_granted && <span className="text-primary font-bold">● Active Environment</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout >
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, File, Folder, Star, CheckCircle, XCircle, Bot, Loader2, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SubmissionDetail() {
  const { id, anonymousId } = useParams(); // assessment ID and anonymous candidate ID
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [selectionStatus, setSelectionStatus] = useState<string>('pending');
  const [assessment, setAssessment] = useState<any>(null);
  const [identitiesRevealed, setIdentitiesRevealed] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [revealing, setRevealing] = useState(false);
  const [hasSelectedCandidates, setHasSelectedCandidates] = useState(false);
  const [aiResult, setAiResult] = useState<{ status: string, score: number | null, report: string | null }>({ status: 'pending', score: null, report: null });

  useEffect(() => {
    loadContents(currentPath);
  }, [currentPath]);

  useEffect(() => {
    loadSubmissionData();
  }, [id, anonymousId]);

  useEffect(() => {
    loadAssessmentData();
  }, [id]);

  const loadSubmissionData = async () => {
    if (!id || !anonymousId) return;

    try {
      // First, let's see what records exist
      const { data: allRecords, error: allError } = await supabase
        .from('assessment_registrations')
        .select('*')
        .eq('assessment_id', id);

      console.log('All registrations for this assessment:', allRecords);
      console.log('Looking for anonymous_id:', anonymousId);

      const { data, error } = await supabase
        .from('assessment_registrations')
        .select('score, notes, anonymous_id, assessment_id, selection_status, user_id, ai_score, ai_report, ai_grading_status')
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId)
        .single();

      console.log('Found registration data:', data, 'error:', error);

      if (error) throw error;
      if (data) {
        setScore(data.score || 0);
        setNotes(data.notes || '');
        setSelectionStatus(data.selection_status || 'pending');
        setAiResult({
          status: data.ai_grading_status || 'pending',
          score: data.ai_score,
          report: data.ai_report
        });

        // Always try to load candidate info if we have user_id
        if (data.user_id) {
          const [candidateRes, profileRes] = await Promise.all([
            supabase.from('candidates').select('full_name, github_username').eq('user_id', data.user_id).single(),
            supabase.from('profiles').select('email').eq('id', data.user_id).single()
          ]);

          console.log('Candidate data:', candidateRes.data);
          console.log('Profile data:', profileRes.data);

          if (candidateRes.data) setCandidateInfo(candidateRes.data);
          if (profileRes.data) setProfileInfo(profileRes.data);
        }
      }
    } catch (error: any) {
      console.error('Error loading submission data:', error);
    }
  };

  const loadAssessmentData = async () => {
    if (!id) return;

    try {
      // Get assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*, positions')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);
      setIdentitiesRevealed(assessmentData?.identities_revealed || false);

      // Check if there are any selected candidates
      const { data: selectedCount } = await supabase
        .from('assessment_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('assessment_id', id)
        .eq('selection_status', 'selected');

      setHasSelectedCandidates((selectedCount as any) > 0);
    } catch (error: any) {
      console.error('Error loading assessment:', error);
    }
  }

  // Poll for AI results if processing
  useEffect(() => {
    let interval: any;
    if (aiResult.status === 'processing' || aiResult.status === 'in_progress' || aiResult.status === 'queued') {
      interval = setInterval(loadSubmissionData, 3000);
    }
    return () => clearInterval(interval);
  }, [aiResult.status]);

  const assessmentEnded = assessment?.start_at && assessment?.duration_minutes
    ? new Date(assessment.start_at).getTime() + (assessment.duration_minutes * 60 * 1000) < Date.now()
    : false;

  const loadContents = async (path: string = '') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-submission-code', {
        body: {
          assessmentId: id,
          anonymousId: anonymousId,
          path: path
        }
      });

      if (error) throw error;

      // If it's a file
      if (data.type === 'file') {
        setCurrentFile(data);
        setContents([]);
      } else {
        // It's a directory
        setContents(Array.isArray(data) ? data : []);
        setCurrentFile(null);
      }
    } catch (error: any) {
      console.error('Error loading code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (path: string, type: string) => {
    if (type === 'dir') {
      setCurrentPath(path);
    } else {
      setCurrentPath(path);
    }
  };

  const goBack = () => {
    if (currentFile) {
      // Go back to directory view
      const pathParts = currentPath.split('/');
      pathParts.pop();
      setCurrentPath(pathParts.join('/'));
    } else if (currentPath) {
      // Go up one directory
      const pathParts = currentPath.split('/');
      pathParts.pop();
      setCurrentPath(pathParts.join('/'));
    } else {
      // Go back to submissions list
      navigate(`/company/assessments/${id}/submissions`);
    }
  };

  const handleSaveScore = async () => {
    if (!id || !anonymousId) return;

    console.log('Saving score and notes:', { id, anonymousId, score, notes });

    try {
      const { data, error } = await supabase
        .from('assessment_registrations')
        .update({ score, notes })
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId)
        .select();

      console.log('Save result:', { data, error });

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Score and notes updated successfully'
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDownloadZip = async () => {
    if (!id || !anonymousId) return;
    setDownloading(true);

    try {
      const { data, error } = await supabase.functions.invoke('download-submission-zip', {
        body: { assessmentId: id, anonymousId }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([Uint8Array.from(atob(data.zipData), c => c.charCodeAt(0))], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${anonymousId}-submission.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Downloaded',
        description: 'Repository downloaded as ZIP'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download repository',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleSelectCandidate = async () => {
    if (!id || !anonymousId) return;

    try {
      const newStatus = selectionStatus === 'selected' ? 'pending' : 'selected';

      const { error } = await supabase
        .from('assessment_registrations')
        .update({ selection_status: newStatus })
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId);

      if (error) throw error;

      setSelectionStatus(newStatus);
      toast({
        title: newStatus === 'selected' ? 'Candidate Selected' : 'Selection Removed',
        description: newStatus === 'selected'
          ? 'This candidate has been marked as selected'
          : 'Selection has been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRejectCandidate = async () => {
    if (!id || !anonymousId) return;

    try {
      const newStatus = selectionStatus === 'rejected' ? 'pending' : 'rejected';

      const { error } = await supabase
        .from('assessment_registrations')
        .update({ selection_status: newStatus })
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId);

      if (error) throw error;

      setSelectionStatus(newStatus);
      toast({
        title: newStatus === 'rejected' ? 'Candidate Rejected' : 'Rejection Removed',
        description: newStatus === 'rejected'
          ? 'This candidate has been marked as rejected'
          : 'Rejection has been removed',
        variant: newStatus === 'rejected' ? 'destructive' : 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRevealIdentities = async () => {
    if (revealing || !hasSelectedCandidates) return;

    setRevealing(true);
    try {
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          identities_revealed: true
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setIdentitiesRevealed(true);

      // Reload data to get candidate details
      await loadSubmissionData();
      await loadAssessmentData();

      toast({
        title: 'Identities Revealed',
        description: 'Candidate identities are now visible for all selected candidates.'
      });
    } catch (error: any) {
      console.error('Error revealing identities:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRevealing(false);
    }
  };

  const handleRunAi = async () => {
    console.log('🔵 handleRunAi called, aiResult.status:', aiResult.status);
    if (!id || !anonymousId) {
      console.log('🔴 Missing id or anonymousId');
      return;
    }

    // Check if running only once
    if (aiResult.status !== 'pending' && aiResult.status !== 'error') {
      console.log('🔴 Status is not pending/error, it is:', aiResult.status);
      return;
    }

    setAiResult(prev => ({ ...prev, status: 'processing' }));
    toast({
      title: 'AI Analysis Started',
      description: 'The AI is now analyzing the submission. This may take up to 60 seconds.',
    });

    try {
      console.log('🟢 Fetching registration data...');
      // Fetch current private repo url
      const { data: regData } = await supabase
        .from('assessment_registrations')
        .select('private_repo_url, id')
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId)
        .single();

      console.log('🟢 Got regData:', regData);
      if (!regData?.private_repo_url) throw new Error('Repo not found');

      console.log('🟢 About to call edge function...');
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('grade-submission', {
        body: {
          assessmentId: id,
          registrationId: regData.id,
          anonymousId: anonymousId,
          privateRepoUrl: regData.private_repo_url
        }
      });
      console.log('🟢 Edge function returned:', { data, error });

      if (error) {
        console.error('Edge function error object:', error);
        throw error;
      }
      if (data && data.success === false) {
        console.error('Backend failure response:', data);
        throw new Error(data.error || 'AI Grading returned failure.');
      }

      // Wait 5s and reload
      setTimeout(() => loadSubmissionData(), 5000);

    } catch (error: any) {
      console.error('AI Grading Error:', error);
      setAiResult(prev => ({ ...prev, status: 'error' }));
      toast({
        title: 'Grading Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold font-mono">
                  {identitiesRevealed && candidateInfo ? candidateInfo.full_name : anonymousId}
                </h1>
                {identitiesRevealed && candidateInfo && (
                  <p className="text-sm text-muted-foreground">@{candidateInfo.github_username} • {profileInfo?.email}</p>
                )}
              </div>
              {currentPath && (
                <span className="text-sm text-muted-foreground font-mono">/{currentPath}</span>
              )}
              {selectionStatus === 'selected' && (
                <Badge className="bg-green-500">SELECTED</Badge>
              )}
              {selectionStatus === 'rejected' && (
                <Badge variant="destructive">REJECTED</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Code Viewer */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                {loading ? (
                  <div className="py-12 text-center text-muted-foreground">Loading...</div>
                ) : currentFile ? (
                  // File view
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="font-mono text-sm font-semibold">{currentFile.name}</span>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                      <code>{currentFile.decoded_content || currentFile.content || 'Unable to load content'}</code>
                    </pre>
                  </div>
                ) : (
                  // Directory view
                  <div className="space-y-2">
                    {contents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Empty directory</p>
                    ) : (
                      contents.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => navigateToPath(item.path, item.type)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                        >
                          {item.type === 'dir' ? (
                            <Folder className="h-5 w-5 text-blue-500" />
                          ) : (
                            <File className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="font-mono text-sm">{item.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Scoring Panel */}
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-mono font-bold mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Evaluation
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score" className="font-mono text-xs">Score (0-10)</Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="font-mono text-xs">Private Notes</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[120px] p-2 border border-border rounded-md font-mono text-xs resize-none bg-background text-foreground"
                      placeholder="Add private evaluation notes..."
                    />
                  </div>
                  <Button onClick={handleSaveScore} className="w-full">
                    Save Evaluation
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-mono font-bold mb-4 text-xs">Quick Actions</h3>
                <div className="space-y-2 text-xs">
                  {!identitiesRevealed && assessment?.is_paid && (
                    <>
                      <Button
                        variant={selectionStatus === 'selected' ? 'default' : 'outline'}
                        size="sm"
                        className={selectionStatus === 'selected' ? 'w-full justify-start font-mono bg-green-600 hover:bg-green-700' : 'w-full justify-start font-mono'}
                        onClick={handleSelectCandidate}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {selectionStatus === 'selected' ? 'Deselect' : 'Select Candidate'}
                      </Button>
                      <Button
                        variant={selectionStatus === 'rejected' ? 'destructive' : 'outline'}
                        size="sm"
                        className="w-full justify-start font-mono"
                        onClick={handleRejectCandidate}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {selectionStatus === 'rejected' ? 'Unreject' : 'Reject Candidate'}
                      </Button>
                      <div className="h-px bg-border my-2" />
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start font-mono"
                    onClick={handleDownloadZip}
                    disabled={downloading}
                  >
                    {downloading ? 'Downloading...' : 'Download as ZIP'}
                  </Button>

                  {/* AI Grading Section (Paid Only) - DISABLED
                  {assessment?.is_paid && (
                    <div className="pt-2">
                      {aiResult.status === 'graded' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-primary/5 p-2 rounded border border-primary/20">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-primary" />
                              <span className="font-mono font-bold text-primary">AI Score</span>
                            </div>
                            <span className="font-mono font-bold text-xl text-primary">{aiResult.score}/10</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full justify-start font-mono group">
                                <File className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                                View AI Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                              <DialogHeader>
                                <DialogTitle className="font-mono flex items-center gap-2">
                                  <Bot className="h-5 w-5 text-primary" />
                                  AI Comprehensive Report
                                </DialogTitle>
                                <DialogDescription>
                                  Automated analysis of code quality, security, and requirements.
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="flex-1 mt-4 p-4 border rounded-md bg-muted/30">
                                <div className="whitespace-pre-wrap font-mono text-xs md:text-sm leading-relaxed">
                                  {aiResult.report || 'No report content available.'}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : aiResult.status === 'processing' || aiResult.status === 'in_progress' || aiResult.status === 'queued' ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded border border-border/50">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="font-mono">AI Grading in progress...</span>
                        </div>
                      ) : aiResult.status === 'error' ? (
                        <div className="text-xs text-destructive font-mono bg-destructive/10 p-2 rounded border border-destructive/20">
                          AI Grading Failed
                        </div>
                      ) : assessment?.status === 'completed' || aiResult.status === 'pending' ? (
                        <div className="flex flex-col gap-2">
                          {(aiResult.status === 'pending' || aiResult.status === 'error') && (
                            <Button
                              size="sm"
                              className="w-full justify-start font-mono bg-purple-600 hover:bg-purple-700 text-white group disabled:opacity-50"
                              onClick={handleRunAi}
                              disabled={!assessmentEnded}
                              title={!assessmentEnded ? 'Available after assessment ends' : 'Run Analysis'}
                            >
                              <Play className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                              {assessmentEnded ? 'Run AI Analysis' : 'Round Active (Wait)'}
                            </Button>
                          )}
                          {aiResult.status === 'pending' && (
                            <p className="text-[10px] text-muted-foreground font-mono italic px-1">
                              Manual trigger: Run rigorous code analysis (1-Click Only).
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                  */}
                  {!identitiesRevealed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-mono"
                      onClick={() => navigate(`/company/assessments/${id}/submissions`)}
                    >
                      View All Submissions
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

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
import { ArrowLeft, File, Folder, Star, CheckCircle, XCircle, Bot, Loader2, Play, Bug } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IdeSandbox } from '@/components/assessment/IdeSandbox';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  decoded_content?: string;
  sha?: string;
  children?: FileNode[];
}

export default function SubmissionDetail() {
  const { id, anonymousId } = useParams(); // assessment ID and anonymous candidate ID
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [explorerFiles, setExplorerFiles] = useState<FileNode[]>([]);
  const [activeFileNode, setActiveFileNode] = useState<FileNode | null>(null);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
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
  const [aiResult, setAiResult] = useState<{ status: string, score: number | null, report: string | null, peerScore: number | null, peerReport: string | null }>({ status: 'pending', score: null, report: null, peerScore: null, peerReport: null });
  const [peerReviewData, setPeerReviewData] = useState<{ peerAnonymousId: string | null, skipped: boolean, bugs: any[] }>({ peerAnonymousId: null, skipped: false, bugs: [] });

  useEffect(() => {
    if (!id || !anonymousId) return;
    
    const cached = sessionStorage.getItem(`wirre-submission-files-${anonymousId}`);
    if (cached) {
      try {
        const parsedTree = JSON.parse(cached);
        setExplorerFiles(parsedTree);
        setLoading(false);
        prefetchBackgroundFiles(parsedTree);
      } catch (e) {
        console.error("Failed to parse cached files", e);
        fetchFileTree("", true).then(tree => {
          if (tree) prefetchBackgroundFiles(tree);
        });
      }
    } else {
      fetchFileTree("", true).then(tree => {
        if (tree) prefetchBackgroundFiles(tree);
      });
    }
  }, [id, anonymousId]);

  useEffect(() => {
    if (explorerFiles.length > 0 && anonymousId) {
      sessionStorage.setItem(`wirre-submission-files-${anonymousId}`, JSON.stringify(explorerFiles));
    }
  }, [explorerFiles, anonymousId]);

  useEffect(() => {
    loadSubmissionData();
  }, [id, anonymousId]);

  useEffect(() => {
    loadAssessmentData();
  }, [id]);

  const loadSubmissionData = async () => {
    if (!id || !anonymousId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_registrations')
        .select('score, notes, anonymous_id, assessment_id, selection_status, user_id, ai_score, ai_report, ai_peer_review_score, ai_peer_review_report, ai_grading_status, assigned_peer_registration_id, peer_review_skipped')
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId)
        .single();

      if (error) throw error;
      if (data) {
        setScore(data.score || 0);
        setNotes(data.notes || '');
        setSelectionStatus(data.selection_status || 'pending');
        setAiResult({
          status: data.ai_grading_status || 'pending',
          score: data.ai_score,
          report: data.ai_report,
          peerScore: data.ai_peer_review_score,
          peerReport: data.ai_peer_review_report
        });

        // Only load real identity data if identities have been revealed
        if (data.user_id) {
          // Always load candidate display info (needed when revealed)
          const { data: candidateRes } = await supabase
            .from('candidates').select('full_name, github_username').eq('user_id', data.user_id).single();
          if (candidateRes) setCandidateInfo(candidateRes);

          // Only fetch email (from profiles) when identities are revealed — avoids 406 RLS error
          if (identitiesRevealed) {
            const { data: profileRes } = await supabase
              .from('profiles').select('email').eq('id', data.user_id).single();
            if (profileRes) setProfileInfo(profileRes);
          }
        }

        // Load peer review info
        const peerRegId = data.assigned_peer_registration_id;
        let peerAnonymousId: string | null = null;
        let peerBugs: any[] = [];

        if (peerRegId) {
          // Get the peer's anonymous_id
          const { data: peerReg } = await supabase
            .from('assessment_registrations')
            .select('anonymous_id')
            .eq('id', peerRegId)
            .single();
          peerAnonymousId = peerReg?.anonymous_id ?? null;
        }

        if (data.user_id) {
          // Get bugs this candidate reported on their assigned peer
          const { data: bugs } = await supabase
            .from('peer_review_bugs')
            .select('*')
            .eq('assessment_id', id)
            .eq('reporter_id', data.user_id)
            .order('created_at', { ascending: true });
          peerBugs = bugs || [];
        }

        setPeerReviewData({
          peerAnonymousId,
          skipped: !!data.peer_review_skipped,
          bugs: peerBugs,
        });
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

  const fetchFileTree = async (path = "", isInitial = false, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-submission-code', {
        body: {
          assessmentId: id,
          anonymousId: anonymousId,
          path,
          recursive: isInitial
        }
      });

      if (error) throw error;

      if (isInitial && data.tree) {
        const nested = transformFlatTree(data.tree);
        setExplorerFiles(nested);
        return nested;
      } else if (data.type === 'file') {
        const updatedFile = { ...data, decoded_content: data.decoded_content || data.content };
        if (!isBackground) setActiveFileNode(updatedFile);
        setExplorerFiles(prev => updateFileInTree(prev, path, updatedFile));
      }
      return data;
    } catch (error: any) {
      console.error('Error loading code:', error);
      if (!isBackground) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load code',
          variant: 'destructive'
        });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const transformFlatTree = (tree: any[]): FileNode[] => {
    const result: FileNode[] = [];
    const level: any = { result };

    tree.forEach(item => {
      if (item.path.startsWith('.')) return;

      item.path.split('/').reduce((acc: any, name: string, i: number, arr: any[]) => {
        if (!acc[name]) {
          acc[name] = { result: [] };
          const node: FileNode = {
            name,
            path: item.path,
            type: item.type === 'tree' ? 'dir' : 'file',
            sha: item.sha,
          };
          if (i === arr.length - 1 && item.type === 'blob') {
            // it's a file
          } else {
            node.children = acc[name].result;
          }
          acc.result.push(node);
        }
        return acc[name];
      }, level);
    });

    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
      nodes.forEach(n => { if (n.children) sortNodes(n.children); });
    };
    sortNodes(result);
    return result;
  };

  const prefetchBackgroundFiles = async (tree: FileNode[]) => {
    const paths: string[] = [];
    const walk = (nodes: FileNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'file' && !n.decoded_content) paths.push(n.path);
        if (n.children) walk(n.children);
      });
    };
    walk(tree);

    if (paths.length > 0) setIsPrefetching(true);

    try {
      for (const path of paths) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await fetchFileTree(path, false, true);
      }
    } finally {
      setIsPrefetching(false);
    }
  };

  const updateFileInTree = (nodes: FileNode[], path: string, updates: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
      if (node.path === path) return { ...node, ...updates };
      if (node.children) return { ...node, children: updateFileInTree(node.children, path, updates) };
      return node;
    });
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'dir') return;
    if (!file.decoded_content) {
      setIsFetchingContent(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-submission-code', {
          body: { assessmentId: id, anonymousId, path: file.path }
        });
        if (error) throw error;
        const updatedFile = { ...file, decoded_content: data.decoded_content || data.content, sha: data.sha };
        setActiveFileNode(updatedFile);
        setExplorerFiles(prev => updateFileInTree(prev, file.path, updatedFile));
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load file content.', variant: 'destructive' });
      } finally {
        setIsFetchingContent(false);
      }
    } else {
      setActiveFileNode(file);
    }
  };

  const goBack = () => {
    navigate(`/company/assessments/${id}/submissions`);
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
    if (!id || !anonymousId) return;

    // Only allow queuing from pending or error states
    if (aiResult.status !== 'pending' && aiResult.status !== 'error') return;

    try {
      // Simply queue the submission — the local grader CLI will pick it up
      const { error } = await supabase
        .from('assessment_registrations')
        .update({ ai_grading_status: 'queued' })
        .eq('assessment_id', id)
        .eq('anonymous_id', anonymousId);

      if (error) throw error;

      setAiResult(prev => ({ ...prev, status: 'queued' }));
      toast({
        title: 'Queued for AI Analysis',
        description: 'This submission has been queued. It will be graded when the grader is running.',
      });
    } catch (error: any) {
      console.error('Queue Error:', error);
      toast({
        title: 'Failed to Queue',
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono font-bold text-sm">Coding Round</h3>
                  {aiResult.score !== null && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-purple-500">
                        <Bot className="h-3 w-3" />
                        <span className="text-[10px] font-mono uppercase font-bold">Code Score</span>
                      </div>
                      <span className="text-lg font-mono font-bold leading-none text-purple-500">{aiResult.score}/10</span>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="py-12 text-center text-muted-foreground">Loading...</div>
                ) : (
                  <IdeSandbox
                    assessmentTitle={assessment?.title || 'Assessment'}
                    files={explorerFiles}
                    activeFile={activeFileNode}
                    onFileSelect={handleFileSelect}
                    onSave={async () => {}} // readOnly prevents this from being called
                    isFetchingContent={isFetchingContent}
                    isPrefetching={isPrefetching}
                    readOnly={true}
                  />
                )}
              </Card>

              {/* Peer Review Section */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono font-bold flex items-center gap-2 text-sm">
                    <Bug className="h-4 w-4 text-orange-400" />
                    Peer Review Submitted
                  </h3>
                  {aiResult.peerScore !== null && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-purple-500">
                        <Bot className="h-3 w-3" />
                        <span className="text-[10px] font-mono uppercase font-bold">Peer AI Score</span>
                      </div>
                      <span className="text-lg font-mono font-bold leading-none text-purple-500">{aiResult.peerScore}/10</span>
                    </div>
                  )}
                </div>
                {peerReviewData.skipped && peerReviewData.bugs.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">Candidate skipped the peer review phase.</p>
                ) : !peerReviewData.peerAnonymousId ? (
                  <p className="text-xs text-muted-foreground font-mono">No peer was assigned to this candidate.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-muted-foreground">
                      Reviewed: <span className="text-foreground font-bold">{peerReviewData.peerAnonymousId}</span>
                    </div>
                    {peerReviewData.bugs.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono italic">No issues were reported.</p>
                    ) : (
                      <div className="space-y-3">
                        {peerReviewData.bugs.map((bug: any) => (
                          <div key={bug.id} className="border border-border rounded-md p-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-semibold">{bug.title}</span>
                              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                bug.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                bug.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                bug.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>{bug.severity}</span>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground leading-relaxed">{bug.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Scoring Panel */}
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono font-bold flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Evaluation
                  </h3>
                  {(aiResult.score !== null || aiResult.peerScore !== null) && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">Total Score</span>
                      <span className="text-lg font-mono font-bold leading-none text-primary">
                        {(score || 0) + ((aiResult.score !== null && aiResult.peerScore !== null) ? ((aiResult.score + aiResult.peerScore) / 2) : (aiResult.score ?? aiResult.peerScore ?? 0))}/20
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score" className="font-mono text-xs">Manual Score (0-10)</Label>
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

                  {/* AI Grading Section */}
                  <div className="pt-2">
                    {aiResult.status === 'graded' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-primary/5 p-2 rounded border border-primary/20">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <span className="font-mono font-bold text-primary">AI Score</span>
                          </div>
                          <span className="font-mono font-bold text-xl text-primary">{(aiResult.score ?? 0) + (aiResult.peerScore ?? 0)}/20</span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full justify-start font-mono group">
                              <File className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                              View AI Code Report
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                              <DialogTitle className="font-mono">AI Code Grading Report</DialogTitle>
                              <DialogDescription className="font-mono text-xs">
                                Detailed analysis of the candidate's implementation.
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="flex-1 mt-4 rounded-md border p-4 bg-muted/30">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {aiResult.report ? (
                                  <div dangerouslySetInnerHTML={{ __html: aiResult.report.replace(/\n/g, '<br/>') }} />
                                ) : (
                                  <p className="text-muted-foreground italic text-sm">No report available.</p>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        {aiResult.peerScore !== null && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full justify-start font-mono group">
                                <Bug className="h-4 w-4 mr-2 group-hover:text-orange-400 transition-colors" />
                                View AI Peer Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                              <DialogHeader>
                                <DialogTitle className="font-mono">AI Peer Review Report</DialogTitle>
                                <DialogDescription className="font-mono text-xs">
                                  Detailed analysis of the candidate's peer review performance.
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="flex-1 mt-4 rounded-md border p-4 bg-muted/30">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  {aiResult.peerReport ? (
                                    <div dangerouslySetInnerHTML={{ __html: aiResult.peerReport.replace(/\n/g, '<br/>') }} />
                                  ) : (
                                    <p className="text-muted-foreground italic text-sm">No peer review report available.</p>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    ) : aiResult.status === 'processing' || aiResult.status === 'in_progress' || aiResult.status === 'queued' ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded border border-border/50">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="font-mono">{aiResult.status === 'queued' ? 'Queued for AI grading...' : 'AI Grading in progress...'}</span>
                      </div>
                    ) : aiResult.status === 'error' ? (
                      <div className="space-y-2">
                        <div className="text-xs text-destructive font-mono bg-destructive/10 p-2 rounded border border-destructive/20">
                          AI Grading Failed
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-start font-mono"
                          onClick={handleRunAi}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Retry AI Analysis
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="w-full justify-start font-mono bg-purple-600 hover:bg-purple-700 text-white group disabled:opacity-50"
                          onClick={handleRunAi}
                          disabled={!assessmentEnded}
                          title={!assessmentEnded ? 'Available after assessment ends' : 'Queue for AI Analysis'}
                        >
                          <Play className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                          {assessmentEnded ? 'Queue AI Analysis' : 'Round Active (Wait)'}
                        </Button>
                        {aiResult.status === 'pending' && (
                          <p className="text-[10px] text-muted-foreground font-mono italic px-1">
                            Queues this submission for AI grading on the local grader.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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

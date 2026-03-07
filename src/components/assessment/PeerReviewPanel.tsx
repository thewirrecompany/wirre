import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, GitBranch, ExternalLink, Download, File, Folder, ArrowLeft, Loader2, Code as CodeIcon, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface PeerReviewPanelProps {
  assessmentId: string;
  registrationId: string;
  peerRepoUrl: string;
  assignedPeerRegistrationId?: string;
}

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export function PeerReviewPanel({ assessmentId, registrationId, peerRepoUrl, assignedPeerRegistrationId }: PeerReviewPanelProps) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(false);

  // File Viewer State
  const [peerAnonymousId, setPeerAnonymousId] = useState<string | null>(null);
  const [fileViewerPath, setFileViewerPath] = useState('');
  const [fileViewerContents, setFileViewerContents] = useState<any[]>([]);
  const [currentFileContent, setCurrentFileContent] = useState<any>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadBugs();
  }, [registrationId]);

  // Fetch Peer Anonymous ID
  useEffect(() => {
    if (assignedPeerRegistrationId) {
      const fetchPeerId = async () => {
        const { data, error } = await supabase
          .from('assessment_registrations')
          .select('anonymous_id')
          .eq('id', assignedPeerRegistrationId)
          .single();
        if (data) {
          setPeerAnonymousId(data.anonymous_id);
        }
      };
      fetchPeerId();
    }
  }, [assignedPeerRegistrationId]);

  // Load files when peer ID is available
  useEffect(() => {
    if (peerAnonymousId) {
      loadFileContents(fileViewerPath);
    }
  }, [peerAnonymousId, fileViewerPath]);

  const loadFileContents = async (path: string = '') => {
    if (!assessmentId || !peerAnonymousId) return;
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-submission-code', {
        body: {
          assessmentId: assessmentId,
          anonymousId: peerAnonymousId,
          path: path
        }
      });

      if (error) throw error;

      if (data.type === 'file') {
        setCurrentFileContent(data);
        setFileViewerContents([]);
      } else {
        setFileViewerContents(Array.isArray(data) ? data : []);
        setCurrentFileContent(null);
      }
    } catch (error: any) {
      console.error('Error loading code:', error);
      // toast({ title: 'Error', description: 'Failed to load file contents' });
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleNavigatePath = (path: string) => {
    setFileViewerPath(path);
  };

  const handleGoBackDir = () => {
    if (!fileViewerPath) return;
    const parts = fileViewerPath.split('/');
    parts.pop();
    setFileViewerPath(parts.join('/'));
  };

  const loadBugs = async () => {
    const { data, error } = await supabase
      .from('peer_review_bugs')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('reporter_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bugs:', error);
    } else {
      setBugs(data || []);
    }
  };

  const handleDownloadZip = async () => {
    if (!peerAnonymousId) {
      toast({ title: 'Error', description: 'Peer ID not found', variant: 'destructive' });
      return;
    }
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('download-submission-zip', {
        body: { assessmentId: assessmentId, anonymousId: peerAnonymousId }
      });

      if (error) throw error;

      const blob = new Blob([Uint8Array.from(atob(data.zipData), c => c.charCodeAt(0))], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peer-review-${peerAnonymousId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Downloaded', description: 'Peer code downloaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Download failed', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      // Use the explicitly passed ID
      if (!assignedPeerRegistrationId) {
        throw new Error('Assigned peer registration ID is missing.');
      }

      const { data, error } = await supabase
        .from('peer_review_bugs')
        .insert({
          assessment_id: assessmentId,
          reporter_id: user.id,
          target_registration_id: assignedPeerRegistrationId,
          title,
          description,
          severity
        })
        .select()
        .single();

      if (error) throw error;

      setBugs([data, ...bugs]);
      setTitle('');
      setDescription('');
      setSeverity('medium');
      toast({ title: 'Bug Reported', description: 'Your finding has been recorded.' });
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to submit bug', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Instructions */}
      <div className="border border-indigo-500/30 bg-indigo-500/10 p-6 rounded-md">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-indigo-500/20 rounded-full shrink-0">
            <CheckCircle2 className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Phase 2: Peer Review
            </h2>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              The coding phase has ended. You have been assigned a peer's repository to review. Your task is to identify bugs, potential issues, and code quality improvements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Repo & Form */}
        <div className="space-y-8">
          {/* Peer Repo Card */}
          <Card className="bg-card/40 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-indigo-400">
                <GitBranch className="h-4 w-4" />
                Assigned Review Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* File Browser / Code Preview */}
                <div className="border border-border rounded-md overflow-hidden bg-black/40 shadow-sm transition-all duration-300">
                  {/* Header Bar */}
                  <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                      {fileViewerPath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 hover:bg-white/10"
                          onClick={handleGoBackDir}
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                      )}
                      <span className="font-mono text-xs text-muted-foreground truncate direction-rtl select-none flex items-center">
                        <GitBranch className="h-3 w-3 mr-2 text-indigo-400" />
                        root
                        {fileViewerPath ? `/${fileViewerPath}` : ''}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono uppercase tracking-widest gap-2 shrink-0 border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-400"
                      onClick={handleDownloadZip}
                      disabled={downloading}
                    >
                      {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      {downloading ? 'Zipping...' : 'Download Code'}
                    </Button>
                  </div>

                  {/* Content Area */}
                  <div className="min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar bg-black/20 relative">
                    {loadingFiles ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                          <span className="text-xs font-mono text-muted-foreground">Loading contents...</span>
                        </div>
                      </div>
                    ) : null}

                    {!loadingFiles && currentFileContent ? (
                      <div className="p-0">
                        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/5 p-2 flex items-center gap-2 text-indigo-400/80">
                          <File className="h-3 w-3" />
                          <span className="font-mono text-xs font-semibold">{currentFileContent.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto bg-white/5 px-2 py-0.5 rounded-full">
                            {(currentFileContent.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="p-4">
                          <pre className="text-[11px] font-mono leading-relaxed tab-4 overflow-x-auto text-gray-300">
                            <code>{currentFileContent.decoded_content || currentFileContent.content || '// Unable to display content'}</code>
                          </pre>
                        </div>
                      </div>
                    ) : !loadingFiles ? (
                      <div className="p-1 space-y-[1px]">
                        {fileViewerContents.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <Folder className="h-8 w-8 opacity-20" />
                            <span className="text-xs font-mono">Empty directory</span>
                          </div>
                        ) : (
                          fileViewerContents
                            .sort((a, b) => {
                              if (a.type === b.type) return a.name.localeCompare(b.name);
                              return a.type === 'dir' ? -1 : 1;
                            })
                            .map((item) => (
                              <button
                                key={item.path}
                                onClick={() => handleNavigatePath(item.path)}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 active:bg-white/10 rounded-sm transition-all text-left group border border-transparent hover:border-white/5"
                              >
                                {item.type === 'dir' ? (
                                  <Folder className="h-4 w-4 text-indigo-400/70 group-hover:text-indigo-400 transition-colors" />
                                ) : (
                                  <File className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                                )}
                                <span className={`font-mono text-xs truncate flex-1 ${item.type === 'dir' ? 'text-indigo-100 font-medium' : 'text-slate-400'}`}>
                                  {item.name}
                                </span>
                                {item.type === 'dir' && (
                                  <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-white/30" />
                                )}
                                <span className="text-[10px] text-white/10 tabular-nums w-16 text-right font-mono">
                                  {item.size ? (item.size < 1024 ? `${item.size} B` : `${(item.size / 1024).toFixed(0)} KB`) : '-'}
                                </span>
                              </button>
                            ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>


                <p className="text-[10px] text-muted-foreground font-mono italic">
                  Note: Access will be revoked automatically after 1 hour.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Report Form */}
          <Card className="bg-card/40 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                Report Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-mono text-xs uppercase text-muted-foreground">Issue Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Memory leak in handler function"
                    className="font-mono text-sm bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="severity" className="font-mono text-xs uppercase text-muted-foreground">Severity</Label>
                    <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                      <SelectTrigger className="font-mono text-sm bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Cosmetic)</SelectItem>
                        <SelectItem value="medium">Medium (Functional)</SelectItem>
                        <SelectItem value="high">High (Major)</SelectItem>
                        <SelectItem value="critical">Critical (Crash/Security)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-mono text-xs uppercase text-muted-foreground">Description & Steps to Reproduce</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="font-mono text-sm min-h-[120px] bg-background/50"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full font-mono text-xs uppercase tracking-widest">
                  {loading ? 'Submitting...' : 'Submit Issue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List of Bugs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">Submitted Issues ({bugs.length})</h3>
          </div>

          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {bugs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <p className="text-muted-foreground font-mono text-xs">No issues reported yet.</p>
              </div>
            ) : (
              bugs.map((bug) => (
                <Card key={bug.id} className="bg-card/20 border-border hover:bg-card/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-sm text-foreground leading-tight">{bug.title}</h4>
                      <Badge variant={
                        bug.severity === 'critical' ? 'destructive' :
                          bug.severity === 'high' ? 'destructive' :
                            bug.severity === 'medium' ? 'secondary' : 'outline'
                      } className="uppercase text-[10px] tracking-wider shrink-0">
                        {bug.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-3">
                      {bug.description}
                    </p>
                    <div className="text-[10px] text-muted-foreground/50 font-mono text-right">
                      {new Date(bug.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

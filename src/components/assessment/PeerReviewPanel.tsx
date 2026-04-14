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
import { Separator } from "@/components/ui/separator";
import { IdeSandbox } from './IdeSandbox';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  decoded_content?: string;
  sha?: string;
  children?: FileNode[];
}

interface PeerReviewPanelProps {
  assessmentId: string;
  registrationId: string;
  peerRepoUrl: string;
  assignedPeerRegistrationId?: string;
  onComplete?: () => void;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export function usePeerReview(assessmentId: string, registrationId: string, assignedPeerRegistrationId?: string) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(false);
  const [peerAnonymousId, setPeerAnonymousId] = useState<string | null>(null);
  const [explorerFiles, setExplorerFiles] = useState<FileNode[]>([]);
  const [activeFileNode, setActiveFileNode] = useState<FileNode | null>(null);
  const [isLoadingExplorer, setIsLoadingExplorer] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (registrationId) {
      loadBugs();
      supabase.rpc('get_peer_anonymous_id', { p_my_registration_id: registrationId })
        .then(({ data, error }) => {
          if (!error && data) setPeerAnonymousId(data);
        });
    }
  }, [registrationId]);

  useEffect(() => {
    if (peerAnonymousId && explorerFiles.length === 0) {
      loadFileContents("", true).then(tree => {
        if (tree) prefetchBackgroundFiles(tree);
      });
    }
  }, [peerAnonymousId]);

  const loadFileContents = async (path: string = '', isInitial = false, isBackground = false) => {
    if (!assessmentId || !peerAnonymousId) return;
    if (!isBackground) setIsLoadingExplorer(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-submission-code', {
        body: { assessmentId, anonymousId: peerAnonymousId, path: path, recursive: isInitial }
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
      } else {
        const contents = Array.isArray(data) ? data : [];
        if (!path) setExplorerFiles(contents);
        else setExplorerFiles(prev => updateFileInTree(prev, path, { children: contents }));
      }
    } catch (error: any) {
      console.error('Error loading code:', error);
    } finally {
      if (!isBackground) setIsLoadingExplorer(false);
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
          if (i !== arr.length - 1 || item.type !== 'blob') node.children = acc[name].result;
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
        await loadFileContents(path, false, true);
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

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'dir') return;
    if (!file.decoded_content) {
      setIsFetchingContent(true);
      loadFileContents(file.path).finally(() => setIsFetchingContent(false));
    } else {
      setActiveFileNode(file);
    }
  };

  const loadBugs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('peer_review_bugs')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setBugs(data || []);
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
      if (!assignedPeerRegistrationId) throw new Error('Assigned peer registration ID is missing.');
      const { data, error } = await supabase
        .from('peer_review_bugs')
        .insert({
          assessment_id: assessmentId,
          reporter_id: user.id,
          target_registration_id: assignedPeerRegistrationId,
          title, description, severity
        })
        .select().single();
      if (error) throw error;
      setBugs([data, ...bugs]);
      setTitle('');
      setDescription('');
      setSeverity('medium');
      toast({ title: 'Bug Reported', description: 'Your finding has been recorded.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit bug', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return {
    bugs, title, setTitle, description, setDescription, severity, setSeverity, loading,
    explorerFiles, activeFileNode, isLoadingExplorer, isFetchingContent, isPrefetching,
    handleFileSelect, handleSubmit
  };
}

export function PeerReviewHeader() {
  return (
    <div className="border border-indigo-500/30 bg-indigo-500/10 p-4 rounded-md max-w-xl self-start">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-indigo-500/20 rounded-full shrink-0">
          <CheckCircle2 className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
            Phase 2: Peer Review
          </h2>
          <p className="text-[10px] text-muted-foreground font-mono leading-relaxed uppercase tracking-tight">
            Coding ended. You have been assigned a peer's repository to review. Identify bugs and improvements.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PeerReviewIdeWorkspace({
  explorerFiles, activeFileNode, handleFileSelect, isLoadingExplorer, isFetchingContent, isPrefetching
}: any) {
  return (
    <div className="space-y-4">
      <IdeSandbox
        assessmentTitle="Peer Review Workspace"
        files={explorerFiles}
        activeFile={activeFileNode}
        onFileSelect={handleFileSelect}
        onSave={async () => { }}
        isLoading={isLoadingExplorer}
        isFetchingContent={isFetchingContent}
        isPrefetching={isPrefetching}
        readOnly={true}
      />
      <p className="text-[10px] text-muted-foreground font-mono italic">
        Reviewing assigned repository. File access is read-only.
      </p>
    </div>
  );
}

export function PeerReviewReporter({
  bugs, title, setTitle, description, setDescription, severity, setSeverity, loading, handleSubmit
}: any) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/40 border-border">
        <CardHeader className="py-4">
          <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
            <AlertCircle className="h-3 w-3 text-orange-400" />
            Report Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-mono text-[10px] uppercase text-muted-foreground">Issue Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Memory leak..."
                className="font-mono text-xs bg-background/50 h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity" className="font-mono text-[10px] uppercase text-muted-foreground">Severity</Label>
              <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                <SelectTrigger className="font-mono text-xs bg-background/50 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="font-mono text-[10px] uppercase text-muted-foreground">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="font-mono text-xs min-h-[80px] bg-background/50"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full font-mono text-[10px] h-8 uppercase tracking-widest">
              {loading ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Findings ({bugs.length})</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {bugs.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-md">
              <p className="text-muted-foreground font-mono text-[10px]">No issues reported.</p>
            </div>
          ) : (
            bugs.map((bug: any) => (
              <Card key={bug.id} className="bg-card/20 border-border">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[11px] text-foreground leading-tight line-clamp-1">{bug.title}</h4>
                    <Badge variant={bug.severity === 'critical' || bug.severity === 'high' ? 'destructive' : 'outline'} className="uppercase text-[8px] px-1 h-4 tracking-wider shrink-0">
                      {bug.severity}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono line-clamp-2">{bug.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PeerReviewPanel({ assessmentId, registrationId, peerRepoUrl, assignedPeerRegistrationId, onComplete }: PeerReviewPanelProps) {
  const pr = usePeerReview(assessmentId, registrationId, assignedPeerRegistrationId);
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PeerReviewHeader />
      <PeerReviewIdeWorkspace {...pr} />
      <PeerReviewReporter {...pr} />
    </div>
  );
}
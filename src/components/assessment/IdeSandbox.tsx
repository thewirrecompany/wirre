import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Save, 
  Terminal as TerminalIcon, 
  Maximize2, 
  ShieldAlert,
  FileText,
  Search,
  Settings,
  Files,
  Loader2,
  ExternalLink,
  Globe,
  Code
} from 'lucide-react';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const WEB_CONTAINER_SUPPORTED_TECH = [
  'node.js', 'javascript', 'typescript', 'react', 'next.js', 'vite', 
  'vue', 'angular', 'svelte', 'express', 'nestjs', 'tailwind css', 
  'html', 'css', 'redux', 'jest', 'vitest', 'postcss', 'sass', 
  'webpack', 'rollup', 'storybook', 'playwright', 'graphql', 'solidjs', 'rxjs'
];

let webContainerInstance: WebContainer | null = null;
let isBooting = false;

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  decoded_content?: string;
  sha?: string;
  children?: FileNode[];
}

interface IdeSandboxProps {
  assessmentTitle: string;
  files: FileNode[];
  activeFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onSave: (changes: { file: FileNode, newContent: string }[]) => Promise<void>;
  isSaving?: boolean;
  isFetchingContent?: boolean;
  isPrefetching?: boolean;
  readOnly?: boolean;
  technologies?: string[];
  isLoading?: boolean;
}

export function IdeSandbox({ 
  assessmentTitle, 
  files, 
  activeFile, 
  onFileSelect, 
  onSave,
  isLoading = false,
  isSaving = false,
  isFetchingContent = false,
  isPrefetching = false,
  readOnly = false,
  technologies = []
}: IdeSandboxProps) {
  const [currentContent, setCurrentContent] = useState('');
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [isWebContainerReady, setIsWebContainerReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const terminalRef = React.useRef<Terminal | null>(null);
  const xtermContainerRef = React.useRef<HTMLDivElement>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);

  // Check if current stack is a subset of supported tech
  const isWebContainerSupported = React.useMemo(() => {
    if (!technologies || technologies.length === 0) return false;
    return technologies.every(tech => 
      WEB_CONTAINER_SUPPORTED_TECH.includes(tech.toLowerCase())
    );
  }, [technologies]);
  const [modifiedFiles, setModifiedFiles] = useState<Record<string, string>>(() => {
    try {
      const cached = sessionStorage.getItem(`wirre-sandbox-modified-${assessmentTitle}`);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    sessionStorage.setItem(`wirre-sandbox-modified-${assessmentTitle}`, JSON.stringify(modifiedFiles));
  }, [modifiedFiles, assessmentTitle]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'info', text: 'WIRRE Sandbox Environment v1.0.4' },
    { type: 'error', text: 'Terminal execution is currently unavailable.' },
    { type: 'info', text: 'We are actively working on supporting full remote execution environments.' },
    { type: 'info', text: 'For now, please focus on identifying bugs and logic improvements through code analysis.' }
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  React.useEffect(() => {
    // block: 'nearest' ensures the scroll happens within the terminal div
    // and doesn't scroll the whole browser window to center the element.
    terminalEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }, [terminalOutput]);

  // Sync internal content when active file changes
  React.useEffect(() => {
    if (activeFile) {
      if (modifiedFiles[activeFile.path] !== undefined) {
        setCurrentContent(modifiedFiles[activeFile.path]);
      } else if (activeFile.decoded_content !== undefined) {
        setCurrentContent(activeFile.decoded_content);
      } else {
        setCurrentContent('Select a file or initialization in progress...');
      }
    } else {
      setCurrentContent('Select a file or initialization in progress...');
    }
  }, [activeFile, modifiedFiles]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCurrentContent(val);
    if (activeFile) {
       setModifiedFiles(prev => ({ ...prev, [activeFile.path]: val }));
    }
  };

  function findFileNode(nodes: FileNode[], path: string): FileNode | null {
    for (const node of nodes) {
       if (node.path === path) return node;
       if (node.children) {
          const found = findFileNode(node.children, path);
          if (found) return found;
       }
    }
    return null;
  }

  const handleSave = async () => {
    // Collect all changes
    const changes = Object.entries(modifiedFiles).map(([path, content]) => {
      const file = findFileNode(files, path);
      return { file, newContent: content };
    }).filter(c => c.file !== null) as { file: FileNode, newContent: string }[];
    
    if (changes.length === 0 && activeFile) {
       await onSave([{ file: activeFile, newContent: currentContent }]);
       return;
    }

    await onSave(changes);
    // Clear modified files after successful save
    setModifiedFiles({});
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In WebContainer mode, we don't handle manual submits via form,
    // the terminal is directly connected to the shell.
    if (isWebContainerSupported) return;

    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalOutput(prev => [
        ...prev,
        { type: 'command', text: `$ ${cmd}` },
        { type: 'info', text: `[WIRRE-SH] Execution of '${cmd.split(' ')[0]}' restricted. Sandbox prevents external process spawning.` }
    ]);
    setTerminalInput('');
  };

  // Helper to map Wirre file nodes to WebContainer FileSystemTree
  const mapFilesToTree = (nodes: FileNode[]): any => {
    const tree: any = {};
    for (const node of nodes) {
      if (node.type === 'dir') {
        tree[node.name] = {
          directory: mapFilesToTree(node.children || [])
        };
      } else {
        tree[node.name] = {
          file: {
            contents: node.decoded_content || ''
          }
        };
      }
    }
    return tree;
  };

  // Initialize WebContainer
  React.useEffect(() => {
    if (!isWebContainerSupported || isInitializing || webContainer || !xtermContainerRef.current) return;

    const init = async () => {
      if (isBooting) return;
      setIsInitializing(true);
      try {
        // 1. Initialize Terminal
        const term = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#000000',
            foreground: '#ffffff',
          },
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(xtermContainerRef.current!);
        fitAddon.fit();
        
        terminalRef.current = term;
        fitAddonRef.current = fitAddon;

        term.writeln('\x1b[1;34mInitializing WIRRE Cloud Sandbox...\x1b[0m');

        // 2. Boot WebContainer (Singleton)
        if (!webContainerInstance) {
          isBooting = true;
          webContainerInstance = await WebContainer.boot();
          isBooting = false;
        }
        const wc = webContainerInstance;
        setWebContainer(wc);

        wc.on('server-ready', (port, url) => {
          setPreviewUrl(url);
        });

        // 3. Mount Files
        const tree = mapFilesToTree(files);
        await wc.mount(tree);

        // 4. Start Shell
        const shellProcess = await wc.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        const input = shellProcess.input.getWriter();
        term.onData((data) => {
          input.write(data);
        });

        setIsWebContainerReady(true);
        term.writeln('\x1b[1;32mSandbox Ready.\x1b[0m');
      } catch (err) {
        console.error('WebContainer init failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      // Cleanup? WebContainers usually persist until page refresh
    };
  }, [isWebContainerSupported, files, xtermContainerRef.current]);

  // Handle resizing
  React.useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col border border-border bg-[#09090b] rounded-md overflow-hidden font-mono shadow-2xl relative",
        document.fullscreenElement ? "h-screen w-screen rounded-none" : "h-[700px]"
      )}
    >
      {/* --- Top Navbar --- */}
      <div className="h-10 border-b border-border bg-[#18181b] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground truncate max-w-[300px] font-mono">{assessmentTitle} / {activeFile?.path || '...'}</span>
          
          {/* Editor/Preview Toggles */}
          {previewUrl && (
             <div className="flex bg-black/40 rounded-sm p-0.5 border border-border/50">
               <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-6 px-3 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all",
                  viewMode === 'editor' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setViewMode('editor')}
               >
                 <Code className="h-3 w-3 mr-1.5" />
                 Code
               </Button>
               <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-6 px-3 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all",
                  viewMode === 'preview' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setViewMode('preview')}
               >
                 <Globe className="h-3 w-3 mr-1.5" />
                 Preview
               </Button>
             </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7 text-muted-foreground hover:text-white", isSaving && "animate-pulse")}
              onClick={handleSave}
              disabled={isSaving || !activeFile}
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-white"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isPrefetching && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#09090b]/90 backdrop-blur-sm border border-border rounded-md animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6 max-w-sm text-center">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Files className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono text-sm font-bold text-primary uppercase tracking-[0.3em]">Fetching your files, please wait</h3>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-relaxed">
                Initializing your workspace.
              </p>
              <div className="pt-4 flex items-center justify-center gap-1">
                <span className="h-1 w-1 bg-primary animate-bounce delay-100" />
                <span className="h-1 w-1 bg-primary animate-bounce delay-200" />
                <span className="h-1 w-1 bg-primary animate-bounce delay-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      <ResizablePanelGroup direction="horizontal">
        {/* --- Sidebar --- */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full border-r border-border bg-[#09090b]">
            <div className="p-3 uppercase text-[10px] tracking-widest text-muted-foreground font-bold flex items-center gap-2 border-b border-border/50">
              <Files className="h-3 w-3" />
              Explorer
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="p-2 space-y-1">
                {isLoading && <div className="p-4 text-[10px] text-muted-foreground animate-pulse">Scanning files...</div>}
                {files.map((file, i) => (
                  <FileItem key={i} item={file} depth={0} activeFile={activeFile} onClick={onFileSelect} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* --- Main Content (Editor + Terminal) --- */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor Area or Preview Iframe */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full bg-[#09090b] relative">
                {viewMode === 'editor' ? (
                  <div className="absolute top-4 left-4 right-4 bottom-4 font-mono text-sm overflow-auto">
                    <div className="flex gap-4 min-h-full">
                      {/* Line Numbers */}
                      <div className="text-right text-muted-foreground/30 select-none pr-4 border-r border-border/50 pt-[2px]">
                        {Array.from({ length: Math.max(20, currentContent.split('\n').length) }).map((_, i) => (
                          <div key={i} className="leading-snug h-[20px]">{i + 1}</div>
                        ))}
                      </div>
                      {/* Code Editor Mock */}
                      <textarea 
                        className={cn(
                          "flex-1 bg-transparent text-gray-300 outline-none resize-none spellcheck-false whitespace-pre leading-snug overflow-hidden",
                          isFetchingContent && "opacity-30"
                        )}
                        style={{ height: `${Math.max(20, currentContent.split('\n').length) * 20}px` }}
                        value={currentContent}
                        onChange={handleContentChange}
                        spellCheck={false}
                        disabled={!activeFile || readOnly || isFetchingContent}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white">
                    {previewUrl ? (
                      <iframe 
                        src={previewUrl} 
                        className="w-full h-full border-none"
                        title="WebContainer Preview"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-[#09090b] text-muted-foreground font-mono text-xs uppercase tracking-widest">
                        Starting preview server...
                      </div>
                    )}
                  </div>
                )}

                {isFetchingContent && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] animate-pulse">Retrieving Content...</span>
                    </div>
                  </div>
                )}
                {/* Warning Overlay (Subtle) */}
                {readOnly && (
                    <div className="absolute bottom-4 right-6 pointer-events-none opacity-20">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-amber-500/80">
                        <FileText className="h-3 w-3" />
                        Review Mode: Read-Only Access
                      </div>
                    </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Terminal Area */}
            <ResizablePanel defaultSize={30}>
              <div className="h-full bg-black border-t border-border flex flex-col">
                <div className="h-8 border-b border-border/50 bg-[#18181b] flex items-center px-4 justify-between shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <TerminalIcon className="h-3 w-3" />
                    Terminal {isWebContainerSupported && isWebContainerReady && <span className="text-green-500 lowercase opacity-60 ml-2">(cloud-ready)</span>}
                  </div>
                  {isWebContainerSupported && !isWebContainerReady && (
                    <div className="flex items-center gap-2 text-[8px] text-primary/70 animate-pulse uppercase tracking-widest">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Provisioning...
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative overflow-hidden">
                  {isWebContainerSupported ? (
                    <div ref={xtermContainerRef} className="absolute inset-0 p-2" />
                  ) : (
                    <ScrollArea className="h-full p-4">
                      <div className="space-y-1 text-xs">
                        {terminalOutput.map((line, i) => (
                          <div key={i} className={cn(
                            line.type === 'info' && "text-blue-400",
                            line.type === 'command' && "text-green-400",
                            line.type === 'error' && "text-red-400",
                            line.type === 'output' && "text-gray-400",
                            "leading-relaxed"
                          )}>
                            {line.text}
                          </div>
                        ))}
                        
                        {/* Interactive Input (Mock) */}
                        <form onSubmit={handleTerminalSubmit} className="flex gap-2 items-center text-green-400 mt-1">
                          <span>$</span>
                          <input
                            type="text"
                            className="bg-transparent outline-none flex-1 border-none p-0 text-gray-300"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </form>
                        <div ref={terminalEndRef} />
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function FileItem({ item, depth, activeFile, onClick }: { item: FileNode, depth: number, activeFile: FileNode | null, onClick: (f: FileNode) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = activeFile?.path === item.path;

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-2 px-2 py-1 cursor-pointer rounded-sm hover:bg-white/5 transition-colors group",
          isActive && item.type !== 'dir' && "bg-primary/10 text-primary border-l-2 border-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (item.type === 'dir') setIsOpen(!isOpen);
          else onClick(item);
        }}
      >
        {item.type === 'dir' ? (
          isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <FileCode className={cn("h-3 w-3 text-muted-foreground", isActive && "text-primary")} />
        )}
        
        {item.type === 'dir' ? (
          <Folder className="h-3 w-3 text-blue-400 fill-current opacity-50" />
        ) : (
          null
        )}
        <span className={cn("text-xs", isActive && item.type !== 'dir' ? "font-bold" : "text-gray-400 group-hover:text-gray-200")}>
          {item.name}
        </span>
      </div>
      
      {item.type === 'dir' && isOpen && item.children && (
        <div className="mt-1">
          {item.children.map((child: FileNode, i: number) => (
            <FileItem key={i} item={child} depth={depth + 1} activeFile={activeFile} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  );
}

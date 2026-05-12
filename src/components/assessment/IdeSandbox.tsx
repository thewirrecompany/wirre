import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
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
  Code,
  RefreshCw
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

const PYODIDE_SUPPORTED_TECH = [
  'python', 'py', 'django', 'flask', 'fastapi', 'numpy', 'pandas', 'scipy'
];

let webContainerInstance: WebContainer | null = null;
let pyodideInstance: any = null;
let isBooting = false;
let isPyodideBooting = false;

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
  const [pyodide, setPyodide] = useState<any>(null);
  const [isWebContainerReady, setIsWebContainerReady] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const terminalRef = React.useRef<Terminal | null>(null);
  const xtermContainerRef = React.useRef<HTMLDivElement>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);

  // Determine which runtime to use
  const runtimeType = React.useMemo(() => {
    if (!technologies || technologies.length === 0) return 'none';
    const techLower = technologies.map(t => t.toLowerCase());
    
    // If all tech is in WebContainer list, use WebContainer
    if (techLower.every(tech => WEB_CONTAINER_SUPPORTED_TECH.includes(tech))) {
      return 'webcontainer';
    }
    
    // If any tech is Python-related, use Pyodide
    if (techLower.some(tech => PYODIDE_SUPPORTED_TECH.includes(tech))) {
      return 'pyodide';
    }
    
    return 'none';
  }, [technologies]);

  const isWebContainerSupported = runtimeType === 'webcontainer';
  const isPyodideSupported = runtimeType === 'pyodide';
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
    { type: 'info', text: 'WIRRE Cloud Sandbox Environment v1.0.6' },
    { type: 'info', text: '=================================================================' },
    { type: 'command', text: '💡 CRITICAL GUIDANCE FOR DEVELOPERS:' },
    { type: 'info', text: '• Running "npm install" for the first time might take 2-3 minutes to provision native packages.' },
    { type: 'info', text: '• DO NOT modify the default application listening port (e.g., 5173), as automated sandboxing binds directly to standard host ingress targets.' },
    { type: 'command', text: '• You MUST click the "Save" button in the navigation bar above to ensure your progress has been saved!' },
    { type: 'info', text: '=================================================================' }
  ]);
  const [previewLogs, setPreviewLogs] = useState<Array<{ type: 'info' | 'log' | 'error' | 'warn', text: string, time: string }>>([
    { type: 'info', text: 'Integrated Preview Console Initialized.', time: new Date().toLocaleTimeString() },
    { type: 'info', text: 'Listening for client-side console output and framework HMR telemetry...', time: new Date().toLocaleTimeString() },
    { type: 'warn', text: 'Note: Server compilation and build failures stream automatically to the native Terminal view below.', time: new Date().toLocaleTimeString() }
  ]);
  const [isPreviewConsoleExpanded, setIsPreviewConsoleExpanded] = useState(true);

  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'object') {
        if (e.data.type === 'CONSOLE_LOG') {
          setPreviewLogs(prev => [...prev, { type: e.data.level || 'log', text: String(e.data.message), time: new Date().toLocaleTimeString() }]);
        } else if (e.data.type === 'vite:ws:error' || e.data.type === 'error') {
          setPreviewLogs(prev => [...prev, { type: 'error', text: String(e.data.message || e.data.error || JSON.stringify(e.data)), time: new Date().toLocaleTimeString() }]);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  // Initialize Pyodide (Python WASM)
  React.useEffect(() => {
    if (!isPyodideSupported || isInitializing || pyodide || !xtermContainerRef.current) return;

    const init = async () => {
      if (isPyodideBooting) return;
      setIsInitializing(true);
      let term: Terminal | null = null;
      try {
        // 1. Initialize Terminal
        term = new Terminal({
          cursorBlink: true,
          theme: { background: '#000000', foreground: '#ffffff' },
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(xtermContainerRef.current!);
        fitAddon.fit();
        terminalRef.current = term;
        fitAddonRef.current = fitAddon;

        term.writeln('\x1b[1;34mInitializing WIRRE Python Sandbox (WASM)...\x1b[0m');

        // 2. Load Pyodide Script
        if (!(window as any).loadPyodide) {
          isPyodideBooting = true;
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // 3. Boot Pyodide
        if (!pyodideInstance) {
          pyodideInstance = await (window as any).loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
          });
        }
        const py = pyodideInstance;
        setPyodide(py);

        // Redirect stdout/stderr to xterm
        py.setStdout({
          batched: (str: string) => term?.writeln(str)
        });
        py.setStderr({
          batched: (str: string) => term?.writeln(`\x1b[31m${str}\x1b[0m`)
        });

        // 4. Load Micropip for package management
        await py.loadPackage('micropip');
        const micropip = py.pyimport('micropip');

        // Pre-load common scientific packages if they are in technologies
        const commonPkgs = ['numpy', 'pandas', 'matplotlib', 'scipy', 'scikit-learn'];
        const pkgsToLoad = technologies
          .map(t => t.toLowerCase())
          .filter(t => commonPkgs.includes(t));
        
        if (pkgsToLoad.length > 0) {
          term.writeln(`\x1b[1;34mPre-loading libraries: ${pkgsToLoad.join(', ')}...\x1b[0m`);
          await py.loadPackage(pkgsToLoad);
          term.writeln('\x1b[1;32mLibraries ready.\x1b[0m');
        }

        // 5. Setup Virtual Filesystem
        const syncFiles = (nodes: FileNode[], parent = '.') => {
          for (const node of nodes) {
            const fullPath = `${parent}/${node.name}`;
            if (node.type === 'dir') {
              try { py.FS.mkdir(fullPath); } catch (e) {}
              syncFiles(node.children || [], fullPath);
            } else {
              py.FS.writeFile(fullPath, node.decoded_content || '');
            }
          }
        };
        syncFiles(files);

        // 6. Simple Pseudo-Shell for Pyodide
        let currentInput = '';
        term.writeln('\x1b[1;32mPython Sandbox Ready.\x1b[0m');
        term.write('\r\n\x1b[1;36m$ \x1b[0m');

        term.onData(async (data) => {
          const code = data.charCodeAt(0);
          if (code === 13) { // Enter
            term.write('\r\n');
            const cmd = currentInput.trim();
            if (!cmd) {
              term.write('\x1b[1;36m$ \x1b[0m');
              currentInput = '';
              return;
            }

            const cmdParts = cmd.split(/\s+/);
            const baseCmd = cmdParts[0];

            if (baseCmd === 'python') {
              const fileName = cmdParts[1];
              if (!fileName) {
                 term.writeln('Usage: python <filename.py>');
              } else {
                try {
                  // CRITICAL: Sync modified files to Pyodide FS before running
                  Object.entries(modifiedFiles).forEach(([path, content]) => {
                    try { py.FS.writeFile(path, content); } catch (e) {}
                  });

                  const content = py.FS.readFile(fileName, { encoding: 'utf8' });
                  await py.runPythonAsync(content);
                } catch (err: any) {
                  term.writeln(`\x1b[31mError: ${err.message}\x1b[0m`);
                }
              }
            } else if (cmd.startsWith('pip install ')) {
              const pkgName = cmdParts[2];
              if (!pkgName) {
                term.writeln('Usage: pip install <package_name>');
              } else {
                term.writeln(`Installing ${pkgName} via micropip...`);
                try {
                  await micropip.install(pkgName);
                  term.writeln(`\x1b[32mSuccessfully installed ${pkgName}\x1b[0m`);
                } catch (err: any) {
                  term.writeln(`\x1b[31mInstallation failed: ${err.message}\x1b[0m`);
                }
              }
            } else if (baseCmd === 'ls') {
              const files = py.FS.readdir('.');
              term.writeln(files.filter((f: string) => f !== '.' && f !== '..').join('  '));
            } else if (baseCmd === 'clear') {
              term.clear();
            } else if (cmd) {
              term.writeln(`sh: command not found: ${baseCmd}`);
              term.writeln('Supported commands: python <file>, pip install <pkg>, ls, clear');
            }
            currentInput = '';
            term.write('\x1b[1;36m$ \x1b[0m');
          } else if (code === 127) { // Backspace
            if (currentInput.length > 0) {
              currentInput = currentInput.slice(0, -1);
              term.write('\b \b');
            }
          } else {
            currentInput += data;
            term.write(data);
          }
        });

        setIsPyodideReady(true);
      } catch (err) {
        console.error('Pyodide init failed:', err);
        term?.writeln('\x1b[31mInitialization failed. Please refresh.\x1b[0m');
      } finally {
        setIsInitializing(false);
        isPyodideBooting = false;
      }
    };

    init();
  }, [isPyodideSupported, files, xtermContainerRef.current]);

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
        term.writeln('\x1b[1;33m=================================================================\x1b[0m');
        term.writeln('\x1b[1;36m💡 CRITICAL GUIDANCE FOR DEVELOPERS:\x1b[0m');
        term.writeln('\x1b[1;37m• Running \x1b[1;32mnpm install\x1b[1;37m for the first time might take \x1b[1;33m2-3 minutes\x1b[1;37m to provision native packages.\x1b[0m');
        term.writeln('\x1b[1;37m• \x1b[1;31mDO NOT\x1b[1;37m modify default server ports (e.g., \x1b[1;33m5173\x1b[1;37m); ingress routing binds directly to standard host streams.\x1b[0m');
        term.writeln('\x1b[1;37m• You MUST click the \x1b[1;32m"Save"\x1b[1;37m button in the navigation bar above to ensure your progress has been saved!\x1b[0m');
        term.writeln('\x1b[1;33m=================================================================\x1b[0m');
      } catch (err) {
        console.error('WebContainer init failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
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

  const renderHighlightedCode = (code: string, filepath: string | undefined) => {
    const ext = filepath?.split('.').pop()?.toLowerCase() || '';
    const isPythonOrShell = ext === 'py' || ext === 'sh' || ext === 'yml' || ext === 'yaml';
    const isHtml = ext === 'html' || ext === 'xml';
    
    return code.split('\n').map((line, lineIdx) => {
      if (!line) return <div key={lineIdx} className="h-[20px] leading-[20px]"></div>;
      
      let commentPart = '';
      let codePart = line;
      
      // Find comment delimiter safely outside standard URL/Hex patterns
      const delim = isPythonOrShell ? '#' : isHtml ? '<!--' : '//';
      const cIdx = line.indexOf(delim);
      if (cIdx !== -1) {
        const isHttp = delim === '//' && line.charAt(cIdx - 1) === ':';
        const isHex = delim === '#' && /[0-9a-fA-F]/.test(line.charAt(cIdx + 1) || '');
        if (!isHttp && (!isHex || isPythonOrShell)) {
          codePart = line.substring(0, cIdx);
          commentPart = line.substring(cIdx);
        }
      }

      // Split code by string literals, keywords, numbers/booleans
      const tokens = codePart.split(/(["'`][^"'`]*["'`])|(\b(?:import|export|const|let|var|function|return|if|else|for|while|class|interface|type|async|await|from|def|try|catch|switch|case|default|break)\b)|(\b(?:true|false|null|undefined|\d+(?:\.\d+)?)\b)/);

      return (
        <div key={lineIdx} className="h-[20px] leading-[20px] whitespace-pre font-mono text-gray-300">
          {tokens.map((token, tIdx) => {
            if (!token) return null;
            const firstChar = token.charAt(0);
            const isStr = (firstChar === '"' || firstChar === "'" || firstChar === '`') && token.length >= 2;
            const isKw = /^(?:import|export|const|let|var|function|return|if|else|for|while|class|interface|type|async|await|from|def|try|catch|switch|case|default|break)$/.test(token);
            const isLit = /^(?:true|false|null|undefined|\d+(?:\.\d+)?)$/.test(token);
            
            let colorClass = ""; 
            if (isStr) colorClass = "text-amber-400"; // gorgeous vibrant gold/amber
            else if (isKw) colorClass = "text-sky-400 font-medium"; // electric cyan/sky blue
            else if (isLit) colorClass = "text-pink-400"; // vibrant pink
            
            return <span key={tIdx} className={colorClass}>{token}</span>;
          })}
          {commentPart && <span className="text-emerald-400 italic">{commentPart}</span>}
        </div>
      );
    });
  };

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
          {(previewUrl || isWebContainerSupported) && (
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
                disabled={!isWebContainerReady}
               >
                 <Globe className="h-3 w-3 mr-1.5" />
                 Preview
               </Button>
               {viewMode === 'preview' && previewUrl && (
                 <Button
                   variant="ghost"
                   size="sm"
                   className="h-6 px-2.5 text-muted-foreground hover:text-white transition-all ml-0.5 border-l border-border/50 rounded-none"
                   onClick={() => setPreviewRefreshKey(k => k + 1)}
                   title="Refresh Preview"
                 >
                   <RefreshCw className="h-3 w-3" />
                 </Button>
               )}
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
                {/* Editor Container */}
                <div className={cn(
                  "absolute inset-0 bg-[#09090b]",
                  viewMode !== 'editor' && "hidden"
                )}>
                  <div className="absolute top-4 left-4 right-4 bottom-4 font-mono text-sm overflow-auto">
                    <div className="flex gap-4 min-h-full w-max min-w-full">
                      {/* Line Numbers (Sticky on horizontal scroll) */}
                      <div className="text-right text-muted-foreground/30 select-none pr-4 border-r border-border/50 pt-[2px] sticky left-0 bg-[#09090b] z-20">
                        {Array.from({ length: Math.max(20, currentContent.split('\n').length) }).map((_, i) => (
                          <div key={i} className="h-[20px] leading-[20px]">{i + 1}</div>
                        ))}
                      </div>
                      {/* Code Editor Area with Live Syntax Highlighting Overlay */}
                      <div className="flex-1 relative pt-[2px] min-w-max pr-4">
                        {/* Syntax Highlighted Text Layer (Dictates Content Dimensions) */}
                        <div 
                          className="pointer-events-none select-none overflow-visible"
                          style={{ minHeight: `${Math.max(20, currentContent.split('\n').length) * 20}px` }}
                          aria-hidden="true"
                        >
                          {renderHighlightedCode(currentContent, activeFile?.path)}
                        </div>
                        
                        {/* Transparent Editable Textarea Layer (Absolutely positioned to match expanded width) */}
                        <textarea 
                          className={cn(
                            "absolute inset-x-0 top-[2px] bottom-0 w-full h-full bg-transparent text-transparent caret-white outline-none resize-none spellcheck-false whitespace-pre overflow-hidden block z-10 p-0 m-0 border-none rounded-none selection:bg-blue-500/30 font-mono text-sm",
                            isFetchingContent && "opacity-30"
                          )}
                          style={{ 
                            lineHeight: '20px',
                          }}
                          value={currentContent}
                          onChange={handleContentChange}
                          spellCheck={false}
                          disabled={!activeFile || readOnly || isFetchingContent}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Container (Preserves active execution state in background) */}
                <div className={cn(
                  "absolute inset-0 flex flex-col bg-white overflow-hidden",
                  viewMode !== 'preview' && "hidden"
                )}>
                  {previewUrl ? (
                    <>
                      <div className="flex-1 relative min-h-0 bg-white">
                        <iframe 
                          key={previewRefreshKey}
                          src={previewUrl} 
                          className="absolute inset-0 w-full h-full border-none bg-white"
                          title="WebContainer Preview"
                        />
                      </div>
                      {/* Integrated Client-Side Preview Console Pane */}
                      <div className={cn(
                        "border-t border-border bg-[#09090b] flex flex-col font-mono text-xs select-text shrink-0 transition-all duration-200",
                        isPreviewConsoleExpanded ? "h-44" : "h-7"
                      )}>
                        <div className="h-7 border-b border-border/50 bg-[#18181b] flex items-center justify-between px-3 shrink-0 select-none">
                          <div 
                            className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground flex-1 h-full"
                            onClick={() => setIsPreviewConsoleExpanded(p => !p)}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                            Preview Console Logs
                            {isPreviewConsoleExpanded ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronUp className="h-3 w-3 ml-1" />}
                            {!isPreviewConsoleExpanded && previewLogs.length > 0 && (
                              <span className="text-[9px] text-blue-400 lowercase ml-1 font-normal">({previewLogs.length} events)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 px-2 text-[9px] text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewLogs([]);
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        {isPreviewConsoleExpanded && (
                          <ScrollArea className="flex-1 p-2">
                            <div className="space-y-1">
                              {previewLogs.map((log, lIdx) => (
                                <div key={lIdx} className="flex gap-3 leading-relaxed hover:bg-white/[0.02] px-1 rounded">
                                  <span className="text-muted-foreground/40 select-none text-[10px] shrink-0">{log.time}</span>
                                  <span className={cn(
                                    "flex-1 font-mono break-all",
                                    log.type === 'info' && "text-blue-400",
                                    log.type === 'log' && "text-gray-300",
                                    log.type === 'warn' && "text-amber-400",
                                    log.type === 'error' && "text-rose-400 font-medium"
                                  )}>
                                    {log.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-[#09090b] text-muted-foreground font-mono text-xs uppercase tracking-widest">
                      Starting preview server...
                    </div>
                  )}
                </div>

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
                    Terminal 
                    {isWebContainerSupported && isWebContainerReady && <span className="text-green-500 lowercase opacity-60 ml-2">(cloud-ready)</span>}
                    {isPyodideSupported && isPyodideReady && <span className="text-blue-500 lowercase opacity-60 ml-2">(wasm-ready)</span>}
                  </div>
                  {(isWebContainerSupported && !isWebContainerReady) || (isPyodideSupported && !isPyodideReady) ? (
                    <div className="flex items-center gap-2 text-[8px] text-primary/70 animate-pulse uppercase tracking-widest">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Provisioning...
                    </div>
                  ) : null}
                </div>
                
                <div className="flex-1 relative overflow-hidden">
                  {isWebContainerSupported || isPyodideSupported ? (
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

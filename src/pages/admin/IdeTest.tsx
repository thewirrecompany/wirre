import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { IdeSandbox } from '@/components/assessment/IdeSandbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, CheckCircle, Code } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  decoded_content?: string;
  sha?: string;
  children?: FileNode[];
}

const INITIAL_FILES: FileNode[] = [
  {
    name: 'index.html',
    type: 'file',
    path: 'index.html',
    decoded_content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WIRRE IDE Test</title>
    <link rel="stylesheet" href="./src/styles.css" />
  </head>
  <body>
    <div class="app-container">
      <header>
        <h1>⚡ WIRRE Secure Sandbox</h1>
        <p>Premium Sandboxed IDE Environment for Elite Engineers</p>
      </header>
      <main>
        <div class="status-card">
          <span class="indicator"></span>
          <p id="status-text">Sandbox Active & Ready</p>
        </div>
        <button id="action-btn">Trigger Action</button>
      </main>
    </div>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>`,
  },
  {
    name: 'src',
    type: 'dir',
    path: 'src',
    children: [
      {
        name: 'main.js',
        type: 'file',
        path: 'src/main.js',
        decoded_content: `// Premium interaction logic
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('action-btn');
  const status = document.getElementById('status-text');

  if (btn && status) {
    btn.addEventListener('click', () => {
      status.textContent = '🚀 Logic Executed Successfully!';
      status.style.color = '#10b981';
      btn.textContent = 'Executed';
      btn.disabled = true;
      console.log('Action triggered inside isolated dev frame');
    });
  }
});`,
      },
      {
        name: 'styles.css',
        type: 'file',
        path: 'src/styles.css',
        decoded_content: `body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.app-container {
  max-w: 500px;
  width: 100%;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-align: center;
}

header h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

header p {
  color: #a1a1aa;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.status-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.indicator {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

button {
  background: #ffffff;
  color: #000000;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

button:disabled {
  background: #3f3f46;
  color: #a1a1aa;
  cursor: not-allowed;
}`,
      },
    ],
  },
];

export default function IdeTest() {
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState<FileNode | null>(INITIAL_FILES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [technologies, setTechnologies] = useState<string[]>(['html', 'javascript', 'css']);

  const handleFileSelect = (selected: FileNode) => {
    setActiveFile(selected);
  };

  const handleSave = async (changes: { file: FileNode; newContent: string }[]) => {
    setIsSaving(true);
    try {
      // Deep clone files to update contents
      const updateNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.type === 'file') {
            const foundChange = changes.find(c => c.file.path === node.path);
            if (foundChange) {
              return { ...node, decoded_content: foundChange.newContent };
            }
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });
      };

      const updatedFiles = updateNodes(files);
      setFiles(updatedFiles);

      // Also update active file object reference if it was changed
      if (activeFile) {
        const foundActiveChange = changes.find(c => c.file.path === activeFile.path);
        if (foundActiveChange) {
          setActiveFile({ ...activeFile, decoded_content: foundActiveChange.newContent });
        }
      }

      // Simulate network save latency
      await new Promise(res => setTimeout(res, 400));

      toast({
        title: 'Sandbox Synchronized',
        description: `Successfully saved ${changes.length} modified file(s).`,
      });
    } catch (err: any) {
      toast({
        title: 'Save Error',
        description: err.message || 'Could not synchronize file tree state.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFiles(INITIAL_FILES);
    setActiveFile(INITIAL_FILES[0]);
    toast({
      title: 'State Reset',
      description: 'Sandbox workspace reverted to initial baseline templates.',
    });
  };

  return (
    <Layout>
      <div className="py-8 md:py-12 animate-in fade-in duration-500">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest text-primary border-primary/30 bg-primary/5">
                  Admin Exclusive Mode
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Direct Access Testing</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-mono font-bold uppercase tracking-tight">
                IDE Development Sandbox
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-muted/50 border border-border px-3 py-1.5 rounded-sm text-xs font-mono">
                <span className="text-muted-foreground">Runtime:</span>
                <span className="text-foreground font-bold uppercase">WebContainer / V8</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="font-mono text-xs uppercase tracking-wider"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin-hover" />
                Reset Workspace
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-sm bg-card/20 shadow-2xl overflow-hidden">
            <IdeSandbox
              assessmentTitle="ADMIN DIRECT TEST ENVIRONMENT"
              files={files}
              activeFile={activeFile}
              onFileSelect={handleFileSelect}
              onSave={handleSave}
              isSaving={isSaving}
              technologies={technologies}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

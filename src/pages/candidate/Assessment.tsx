import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { GitBranch, Terminal, Clock, CheckCircle } from "lucide-react";

const assessmentData = {
  id: "abc123",
  role: "Senior Backend Engineer",
  company: "Acme Corp",
  deadline: "2024-01-20T23:59:00Z",
  status: "in_progress",
  repoUrl: "git@wirre.dev:assess/abc123.git",
  description: `
## Overview

You are tasked with implementing a rate-limiting service for a distributed API gateway. The service must handle high throughput while maintaining accuracy across multiple instances.

## Requirements

### Functional Requirements

1. Implement a sliding window rate limiter
2. Support configurable limits per API key
3. Handle at least 10,000 requests per second per instance
4. Maintain accuracy within 1% tolerance

### Technical Constraints

- Must use Redis for distributed state
- Service must be stateless (except Redis)
- Maximum latency: 5ms p99
- Must handle Redis failures gracefully

## Deliverables

1. Complete implementation in Go
2. Unit tests with >80% coverage
3. Integration tests with Redis
4. Documentation for deployment

## Evaluation Criteria

Your submission will be evaluated on:

- **Functional Correctness**: Does it work as specified?
- **Performance**: Does it meet latency and throughput requirements?
- **Code Quality**: Is the code clean, well-structured, and maintainable?
- **Error Handling**: How does it handle edge cases and failures?
- **Documentation**: Is the code and approach well documented?
  `.trim(),
  steps: [
    { id: 1, title: "Clone repository", status: "completed" },
    { id: 2, title: "Review requirements", status: "completed" },
    { id: 3, title: "Implementation", status: "in_progress" },
    { id: 4, title: "Testing", status: "pending" },
    { id: 5, title: "Submit PR", status: "pending" },
  ],
};

export default function Assessment() {
  const { id } = useParams();

  return (
    <Layout>
      <div className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-2">
                  Assessment
                </p>
                <h1 className="text-3xl font-bold font-mono tracking-tight">
                  {assessmentData.role}
                </h1>
                <p className="text-muted-foreground font-mono mt-1">
                  {assessmentData.company}
                </p>
              </div>

              {/* Problem Description */}
              <div className="border border-border p-6 mb-8">
                <div className="prose prose-invert max-w-none">
                  <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {assessmentData.description.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-8 mb-4 first:mt-0">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-lg font-bold mt-6 mb-3">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('- **')) {
                        const [label, ...rest] = line.replace('- **', '').split('**:');
                        return <p key={i} className="my-2"><strong>{label}</strong>:{rest.join('')}</p>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={i} className="my-1 ml-4">{line}</p>;
                      }
                      return <p key={i} className={line ? "my-2 text-muted-foreground" : "my-4"}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="border border-border p-6 mb-8">
                <h2 className="font-mono font-bold mb-4">Submission Instructions</h2>
                <div className="font-mono text-sm space-y-4">
                  <div className="p-4 bg-secondary/50">
                    <p className="text-muted-foreground mb-2"># Clone the assessment repository</p>
                    <p>$ git clone {assessmentData.repoUrl}</p>
                  </div>
                  <div className="p-4 bg-secondary/50">
                    <p className="text-muted-foreground mb-2"># Start the development environment</p>
                    <p>$ cd abc123</p>
                    <p>$ docker-compose up -d</p>
                  </div>
                  <div className="p-4 bg-secondary/50">
                    <p className="text-muted-foreground mb-2"># Submit your solution</p>
                    <p>$ git checkout -b solution</p>
                    <p>$ git add -A</p>
                    <p>$ git commit -m "Submit solution"</p>
                    <p>$ git push origin solution</p>
                  </div>
                </div>
              </div>

              {/* Repository URL */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <GitBranch className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Repository</h2>
                </div>
                <div className="flex items-center gap-4">
                  <code className="flex-1 p-3 bg-secondary font-mono text-sm">
                    {assessmentData.repoUrl}
                  </code>
                  <Button variant="outline" size="sm">
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status Panel */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Status</h2>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="uppercase text-xs tracking-wider">In Progress</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span>{assessmentData.id}</span>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Deadline</h2>
                </div>
                <p className="font-mono text-sm">
                  {new Date(assessmentData.deadline).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Progress */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Progress</h2>
                </div>
                <div className="space-y-3">
                  {assessmentData.steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 font-mono text-sm">
                      <div className={`w-2 h-2 ${
                        step.status === 'completed' ? 'bg-foreground' :
                        step.status === 'in_progress' ? 'bg-foreground animate-pulse' :
                        'bg-muted'
                      }`} />
                      <span className={step.status === 'pending' ? 'text-muted-foreground' : ''}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  Submit Solution
                </Button>
                <Button variant="outline" className="w-full">
                  Request Extension
                </Button>
              </div>

              {/* Prototype Notice */}
              <div className="p-4 border border-border bg-secondary/50">
                <p className="text-xs text-muted-foreground font-mono">
                  Assessment functionality not yet active. This is a frontend prototype only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

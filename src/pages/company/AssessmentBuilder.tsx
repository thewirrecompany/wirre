import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roles = [
  "Backend Engineer",
  "Senior Backend Engineer",
  "Staff Backend Engineer",
  "Platform Engineer",
  "Senior Platform Engineer",
  "Systems Engineer",
  "Staff Systems Engineer",
  "Infrastructure Engineer",
];

const templates = [
  { id: "api-design", name: "API Design & Implementation", difficulty: "Medium" },
  { id: "data-pipeline", name: "Data Pipeline Construction", difficulty: "Hard" },
  { id: "service-reliability", name: "Service Reliability", difficulty: "Hard" },
  { id: "database-optimization", name: "Database Optimization", difficulty: "Medium" },
  { id: "distributed-systems", name: "Distributed Systems", difficulty: "Expert" },
];

const faults = [
  { id: "memory-leak", name: "Memory Leak", description: "Gradual memory consumption increase" },
  { id: "race-condition", name: "Race Condition", description: "Concurrent access issues" },
  { id: "network-partition", name: "Network Partition", description: "Simulated network failures" },
  { id: "slow-dependency", name: "Slow Dependency", description: "External service latency" },
  { id: "data-corruption", name: "Data Corruption", description: "Invalid data injection" },
];

export default function AssessmentBuilder() {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedFaults, setSelectedFaults] = useState<string[]>([]);
  const [weights, setWeights] = useState({
    functional: 30,
    performance: 20,
    quality: 20,
    security: 15,
    production: 15,
  });

  const toggleFault = (faultId: string) => {
    setSelectedFaults((prev) =>
      prev.includes(faultId)
        ? prev.filter((f) => f !== faultId)
        : [...prev, faultId]
    );
  };

  const handleWeightChange = (key: keyof typeof weights, value: string) => {
    const numValue = parseInt(value) || 0;
    setWeights((prev) => ({ ...prev, [key]: numValue }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold font-mono tracking-tight mb-2">
            Create Assessment
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-12">
            Configure a governed workflow for engineering evaluation
          </p>

          {/* Role Selection */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Select Role
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 border font-mono text-xs text-left transition-colors ${
                    selectedRole === role
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </section>

          {/* Template Selection */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Select Template
            </Label>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full p-4 border font-mono text-left transition-colors flex justify-between items-center ${
                    selectedTemplate === template.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  <span className="text-sm">{template.name}</span>
                  <span className={`text-xs uppercase tracking-wider ${
                    selectedTemplate === template.id ? "opacity-70" : "text-muted-foreground"
                  }`}>
                    {template.difficulty}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-mono">
              Templates are pre-approved assessment patterns governed by organizational policy.
            </p>
          </section>

          {/* Fault Injection */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Inject Faults (Optional)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {faults.map((fault) => (
                <button
                  key={fault.id}
                  onClick={() => toggleFault(fault.id)}
                  className={`p-4 border font-mono text-left transition-colors ${
                    selectedFaults.includes(fault.id)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  <span className="text-sm font-bold block">{fault.name}</span>
                  <span className={`text-xs ${
                    selectedFaults.includes(fault.id) ? "opacity-70" : "text-muted-foreground"
                  }`}>
                    {fault.description}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-mono">
              Faults introduce controlled failure modes to evaluate debugging and resilience skills.
            </p>
          </section>

          {/* Scoring Weights */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Scoring Weights
            </Label>
            <div className="border border-border p-6 space-y-6">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="font-mono text-sm capitalize w-32">{key}</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleWeightChange(key as keyof typeof weights, e.target.value)}
                    className="w-20 font-mono text-center"
                  />
                  <span className="text-muted-foreground font-mono text-sm">%</span>
                  <div className="flex-1 h-2 bg-secondary">
                    <div
                      className="h-2 bg-foreground transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="font-mono text-sm">Total</span>
                <span className={`font-mono text-sm font-bold ${totalWeight !== 100 ? "text-destructive" : ""}`}>
                  {totalWeight}%
                </span>
              </div>
              {totalWeight !== 100 && (
                <p className="text-xs text-destructive font-mono">
                  Weights must sum to 100%
                </p>
              )}
            </div>
          </section>

          {/* Governance Notice */}
          <div className="mb-12 p-4 border border-border bg-secondary/50">
            <h3 className="font-mono text-sm font-bold mb-2">Governance</h3>
            <p className="text-xs text-muted-foreground font-mono">
              This assessment will be subject to organizational policies including time limits, 
              candidate communication rules, and audit logging. All configurations are versioned 
              and changes require appropriate approvals.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button size="lg" disabled={!selectedRole || !selectedTemplate || totalWeight !== 100}>
              Publish Assessment
            </Button>
            <Button variant="outline" size="lg">
              Save Draft
            </Button>
          </div>

          {/* Prototype Notice */}
          <div className="mt-12 p-4 border border-border bg-secondary/50">
            <p className="text-xs text-muted-foreground font-mono">
              Assessment builder not yet functional. This is a frontend prototype only.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

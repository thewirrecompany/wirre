import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const predefinedRoles = [
  "Backend Engineer",
  "Senior Backend Engineer",
  "Staff Backend Engineer",
  "Platform Engineer",
  "Senior Platform Engineer",
  "Systems Engineer",
  "Staff Systems Engineer",
  "Infrastructure Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
];

const templates = [
  { id: "bug-fix", name: "Bug Fix & Debugging", description: "Fix critical production bugs" },
  { id: "feature-implementation", name: "Feature Implementation", description: "Build a new feature from requirements" },
  { id: "refactoring", name: "Code Refactoring", description: "Improve existing codebase structure" },
  { id: "performance", name: "Performance Optimization", description: "Optimize slow code paths" },
  { id: "api-design", name: "API Design", description: "Design and implement REST/GraphQL APIs" },
  { id: "testing", name: "Testing & Quality", description: "Add comprehensive test coverage" },
];

const predefinedFaults = [
  { id: "memory-leak", name: "Memory Leak", description: "Gradual memory consumption increase" },
  { id: "race-condition", name: "Race Condition", description: "Concurrent access issues" },
  { id: "security-vuln", name: "Security Vulnerability", description: "Authentication/authorization issues" },
  { id: "api-errors", name: "API Errors", description: "HTTP endpoint returning wrong responses" },
  { id: "data-corruption", name: "Data Corruption", description: "Database inconsistencies" },
  { id: "slow-queries", name: "Slow Database Queries", description: "Unoptimized database access" },
];

export default function AssessmentBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [customTemplateDescription, setCustomTemplateDescription] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [positions, setPositions] = useState(1);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [selectedFaults, setSelectedFaults] = useState<string[]>([]);
  const [customFaults, setCustomFaults] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [newFaultName, setNewFaultName] = useState("");
  const [newFaultDescription, setNewFaultDescription] = useState("");
  
  const [weights, setWeights] = useState({
    codeQuality: 30,
    architecture: 25,
    testing: 20,
    documentation: 15,
    bestPractices: 10,
  });

  // Status check states
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasRepoAccess, setHasRepoAccess] = useState(false);
  const [hasPaymentConfirmed, setHasPaymentConfirmed] = useState(false);

  const toggleFault = (faultId: string) => {
    setSelectedFaults((prev) =>
      prev.includes(faultId)
        ? prev.filter((f) => f !== faultId)
        : [...prev, faultId]
    );
  };

  const addCustomFault = () => {
    if (!newFaultName.trim() || !newFaultDescription.trim()) return;
    
    const newFault = {
      id: `custom-${Date.now()}`,
      name: newFaultName,
      description: newFaultDescription,
    };
    
    setCustomFaults(prev => [...prev, newFault]);
    setSelectedFaults(prev => [...prev, newFault.id]);
    setNewFaultName("");
    setNewFaultDescription("");
  };

  const handleWeightChange = (key: keyof typeof weights, value: string) => {
    const numValue = parseInt(value) || 0;
    setWeights((prev) => ({ ...prev, [key]: numValue }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  const finalRole = customRole.trim() || selectedRole;
  const finalTemplate = customTemplateName.trim() || selectedTemplate;
  const allFaults = [...predefinedFaults, ...customFaults];
  
  const maxSalaryNum = parseFloat(maxSalary) || 0;
  const minSalaryNum = parseFloat(minSalary) || 0;
  const platformFee = positions * 0.20 * maxSalaryNum;
  
  const allFieldsFilled = finalRole && finalTemplate && githubRepo.trim() && totalWeight === 100 && selectedFaults.length > 0 && minSalaryNum > 0 && maxSalaryNum > 0 && maxSalaryNum >= minSalaryNum;
  const canPublish = allFieldsFilled && hasCheckedStatus && hasRepoAccess && hasPaymentConfirmed;

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    
    // Simulate requesting repo access and payment
    toast({
      title: "Verification Initiated",
      description: "Repository access request sent. Please complete payment to continue.",
    });

    // Simulate checking - in production, this would be real API calls
    setTimeout(() => {
      setHasRepoAccess(true);
      toast({
        title: "Repository Access Granted",
        description: `WIRRE now has access to ${githubRepo}`,
      });
    }, 2000);

    setTimeout(() => {
      setHasPaymentConfirmed(true);
      toast({
        title: "Payment Confirmed",
        description: `$${platformFee.toLocaleString()} received. You can now publish the role.`,
      });
      setCheckingStatus(false);
      setHasCheckedStatus(true);
    }, 4000);
  };

  const handlePublish = () => {
    toast({
      title: "Role Published",
      description: `${finalRole} is now live for candidates to register.`,
    });
    navigate('/company/dashboard');
  };

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold font-mono tracking-tight mb-2">
            Hire
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-12">
            Configure assessment round for candidates
          </p>

          {/* Role Selection */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Select Role
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {predefinedRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setCustomRole("");
                  }}
                  className={`p-3 border font-mono text-xs text-left transition-colors ${
                    selectedRole === role && !customRole
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Label className="font-mono text-xs mb-2 block">Custom Role</Label>
              <Input
                placeholder="Enter custom role name..."
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  setSelectedRole("");
                }}
                className="font-mono"
              />
            </div>
          </section>

          {/* GitHub Repository */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              GitHub Repository
            </Label>
            <Input
              placeholder="owner/repository"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              className="font-mono mb-2"
            />
            <p className="text-xs text-muted-foreground font-mono">
              Provide the repository URL. Ensure WIRRE has access before publishing. The README should specify what candidates need to solve.
            </p>
          </section>

          {/* Positions Available */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Positions Available
            </Label>
            <Input
              type="number"
              min="1"
              value={positions}
              onChange={(e) => {
                const val = e.target.value;
                setPositions(val === '' ? 1 : parseInt(val) || 1);
              }}
              onFocus={(e) => e.target.select()}
              className="font-mono w-32"
            />
          </section>

          {/* Salary Range */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Salary Range (Annual, in USD)
            </Label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label className="font-mono text-xs mb-2 block">Min Salary (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="80000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="font-mono"
                />
              </div>
              <span className="text-muted-foreground mt-6">—</span>
              <div className="flex-1">
                <Label className="font-mono text-xs mb-2 block">Max Salary (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="150000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            {maxSalaryNum > 0 && (
              <div className="mt-4 p-4 border border-border bg-secondary/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">Platform Fee (20% × Max Salary × Positions)</span>
                  <span className="font-mono text-lg font-bold">
                    ${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Partial refunds available. Fee refunded for unhired positions (e.g., if 1 of 5 hired, 4/5 of fee refunded).
                </p>
              </div>
            )}
          </section>

          {/* Template Selection */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Select Template
            </Label>
            <div className="space-y-2 mb-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setCustomTemplateName("");
                    setCustomTemplateDescription("");
                  }}
                  className={`w-full p-4 border font-mono text-left transition-colors ${
                    selectedTemplate === template.id && !customTemplateName
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-bold block">{template.name}</span>
                      <span className={`text-xs ${
                        selectedTemplate === template.id && !customTemplateName ? "opacity-70" : "text-muted-foreground"
                      }`}>
                        {template.description}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom Template */}
            <div className="border border-border p-4 mt-4">
              <Label className="font-mono text-xs mb-2 block">Custom Template</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Template name"
                  value={customTemplateName}
                  onChange={(e) => {
                    setCustomTemplateName(e.target.value);
                    setSelectedTemplate("");
                  }}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Template description"
                  value={customTemplateDescription}
                  onChange={(e) => setCustomTemplateDescription(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground font-mono">
              Templates provide general direction for what candidates should accomplish.
            </p>
          </section>

          {/* Mention Faults */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Mention Faults
            </Label>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              Select what issues exist in the repository that candidates need to solve. The repository README should already describe these.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {allFaults.map((fault) => (
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
            
            {/* Add Custom Fault */}
            <div className="border border-border p-4 mt-4">
              <Label className="font-mono text-xs mb-2 block">Add Custom Fault</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Fault name"
                  value={newFaultName}
                  onChange={(e) => setNewFaultName(e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Fault description"
                  value={newFaultDescription}
                  onChange={(e) => setNewFaultDescription(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={addCustomFault}
                  variant="outline"
                  size="sm"
                  disabled={!newFaultName.trim() || !newFaultDescription.trim()}
                >
                  Add Fault
                </Button>
              </div>
            </div>
          </section>

          {/* Scoring Weights */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Scoring Weights (Not Visible to Candidates)
            </Label>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              Configure how PRs will be evaluated. These weights are kept private.
            </p>
            <div className="border border-border p-6 space-y-6">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="font-mono text-sm w-40" style={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleWeightChange(key as keyof typeof weights, e.target.value)}
                    onFocus={(e) => e.target.select()}
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

          {/* Actions */}
          <div className="flex gap-4">
            {!hasCheckedStatus ? (
              <Button 
                size="lg" 
                onClick={handleCheckStatus}
                disabled={!allFieldsFilled || checkingStatus}
              >
                {checkingStatus ? "Checking..." : "Check Status"}
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={handlePublish}
                disabled={!canPublish}
              >
                Publish Role
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/company/dashboard')}
            >
              Cancel
            </Button>
          </div>
          
          {/* Status Messages */}
          {!allFieldsFilled && (
            <div className="mt-4 p-3 border border-border bg-secondary/50">
              <p className="text-xs text-muted-foreground font-mono">
                Required: Role, GitHub repository, Salary range (max ≥ min), Template, at least one Fault, and weights summing to 100%
              </p>
            </div>
          )}

          {hasCheckedStatus && (
            <div className="mt-4 space-y-2">
              <div className={`p-3 border font-mono text-sm ${hasRepoAccess ? 'border-foreground bg-foreground/10' : 'border-border bg-secondary/50'}`}>
                <span className="mr-2">{hasRepoAccess ? '✓' : '○'}</span>
                Repository Access: {hasRepoAccess ? `Granted to ${githubRepo}` : 'Pending'}
              </div>
              <div className={`p-3 border font-mono text-sm ${hasPaymentConfirmed ? 'border-foreground bg-foreground/10' : 'border-border bg-secondary/50'}`}>
                <span className="mr-2">{hasPaymentConfirmed ? '✓' : '○'}</span>
                Payment: {hasPaymentConfirmed ? `Confirmed ($${platformFee.toLocaleString()})` : 'Pending'}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

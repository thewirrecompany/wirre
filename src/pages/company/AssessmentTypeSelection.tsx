import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

export default function AssessmentTypeSelection() {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="py-24 container max-w-4xl">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold font-mono mb-4">Select Assessment Type</h1>
                    <p className="text-muted-foreground font-mono">Choose the type of assessment you want to create</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Paid Option */}
                    <div
                        className="border border-border p-8 hover:border-foreground transition-colors cursor-pointer group"
                        onClick={() => navigate('/company/assessments/new?paid=true')}
                    >
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                            <span className="text-2xl">💼</span>
                        </div>
                        <h3 className="text-xl font-bold font-mono mb-2">Paid Assessment</h3>
                        <p className="text-sm text-muted-foreground font-mono mb-6">
                            For hiring professionals. Set a salary range, define custom roles, and find the best candidates.
                        </p>
                        <ul className="text-sm space-y-2 mb-8">
                            <li className="flex items-center gap-2">✓ Salary Transparency</li>
                            <li className="flex items-center gap-2">✓ Custom Roles</li>
                            <li className="flex items-center gap-2">✓ Full Candidate Profiles</li>
                        </ul>
                        <Button className="w-full font-mono">Select Paid</Button>
                    </div>

                    {/* Unpaid Option */}
                    <div
                        className="border border-border p-8 hover:border-foreground transition-colors cursor-pointer group"
                        onClick={() => navigate('/company/assessments/new?paid=false')}
                    >
                        <div className="h-12 w-12 bg-secondary rounded-lg flex items-center justify-center mb-6 group-hover:bg-secondary/80 transition-colors">
                            <span className="text-2xl">🎓</span>
                        </div>
                        <h3 className="text-xl font-bold font-mono mb-2">Practice Round</h3>
                        <p className="text-sm text-muted-foreground font-mono mb-6">
                            For practice and skill-building. No salary range, standard roles, and focused on learning.
                        </p>
                        <ul className="text-sm space-y-2 mb-8">
                            <li className="flex items-center gap-2">✓ Standard Roles</li>
                            <li className="flex items-center gap-2">✓ Pure Skill Assessment</li>
                            <li className="flex items-center gap-2">✓ Community Focused</li>
                        </ul>
                        <Button variant="outline" className="w-full font-mono">Select Practice</Button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Button variant="ghost" onClick={() => navigate('/company/dashboard')}>Cancel</Button>
                </div>
            </div>
        </Layout>
    );
}

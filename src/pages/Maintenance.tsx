import { Layout } from "@/components/layout/Layout";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Maintenance() {
    return (
        <Layout>
            <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-24">
                <div className="container max-w-2xl text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-rose-600 blur opacity-20 animate-pulse"></div>
                            <div className="relative h-20 w-20 rounded-full bg-secondary flex items-center justify-center border border-border">
                                <Hammer className="h-10 w-10 text-rose-600" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold font-mono tracking-tighter mb-6 uppercase">
                        Under Maintenance
                    </h1>

                    <p className="text-xl font-mono text-muted-foreground mb-12 leading-relaxed">
                        WIRRE is currently undergoing scheduled maintenance to improve the arena.
                        Sign-ups and logins are temporarily disabled.
                    </p>

                    <div className="p-6 border border-border bg-card/30 rounded-sm mb-12 flex flex-col items-center">
                        <pre className="font-mono text-xs text-rose-500 mb-4 uppercase tracking-widest animate-pulse">
                            [ STATUS: REBUILDING_INFRASTRUCTURE ]
                        </pre>
                        <p className="text-sm font-mono text-muted-foreground">
                            We'll be back online soon. In the meantime, you can explore the homepage or follow us for updates.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <Button variant="outline" asChild className="font-mono">
                            <Link to="/">Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

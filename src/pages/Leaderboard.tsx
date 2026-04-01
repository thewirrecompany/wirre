import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/hooks/queries/useLeaderboard';

function LeaderboardSkeleton() {
    return (
        <Layout>
            <div className="py-12 md:py-20">
                <div className="container max-w-4xl px-4">
                    <div className="text-center mb-12 animate-pulse">
                        <div className="h-5 w-32 bg-muted rounded mx-auto mb-4" />
                        <div className="h-12 w-64 bg-muted rounded mx-auto mb-4" />
                        <div className="h-4 w-96 bg-muted/60 rounded mx-auto" />
                    </div>
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-1 h-3 bg-muted rounded" />
                                <div className="col-span-8 h-3 bg-muted rounded" />
                                <div className="col-span-3 h-3 bg-muted rounded" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b last:border-b-0">
                                    <div className="col-span-1 h-5 w-5 bg-muted rounded" />
                                    <div className="col-span-8 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-muted hidden md:block" />
                                        <div>
                                            <div className="h-4 w-32 bg-muted rounded mb-1" />
                                            <div className="h-3 w-20 bg-muted/60 rounded" />
                                        </div>
                                    </div>
                                    <div className="col-span-3 flex justify-end">
                                        <div className="h-7 w-16 bg-muted rounded" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}

export default function Leaderboard() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading } = useLeaderboard(id);

    const entries = data?.entries ?? [];
    const assessmentTitle = data?.assessmentTitle ?? null;

    if (isLoading) return <LeaderboardSkeleton />;

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-foreground" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-muted-foreground/60" />;
        return <span className="font-mono font-bold text-muted-foreground/40">{rank}</span>;
    };

    return (
        <Layout>
            <div className="py-12 md:py-20 animate-fade-in relative overflow-hidden">
                <div className="container max-w-4xl relative z-10 px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="uppercase tracking-widest text-[10px] mb-4 bg-background/50 backdrop-blur-sm border-border text-foreground">
                            {id ? 'Opportunity Standings' : 'Global Rankings'}
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-mono font-bold uppercase tracking-tighter text-foreground mb-4 drop-shadow-sm">
                            {id ? (assessmentTitle || 'Leaderboard') : 'Hall of Fame'}
                        </h1>
                        <p className="text-muted-foreground font-mono max-w-xl mx-auto text-sm">
                            {id
                                ? 'Top performers for this specific assessment round.'
                                : 'The most elite engineers on the platform, ranked by total performance.'}
                        </p>
                    </div>

                    <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden rounded-xl">
                        <CardHeader className="bg-black/20 border-b border-white/5 px-6 py-4">
                            <div className="grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-muted-foreground font-mono font-semibold">
                                <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                                <div className="col-span-7 md:col-span-8">Candidate</div>
                                <div className="col-span-3 md:col-span-3 text-right">Score</div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {entries.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <Star className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                    <p className="font-mono text-muted-foreground">No scores recorded yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {entries.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "grid grid-cols-12 gap-4 items-center px-6 py-4 transition-all hover:bg-white/5",
                                                entry.rank === 1 && "bg-white/5",
                                            )}
                                        >
                                            <div className="col-span-2 md:col-span-1 flex justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>

                                            <div className="col-span-7 md:col-span-8 flex items-center gap-4">
                                                <div className="hidden md:flex h-10 w-10 shrink-0 rounded-full bg-muted/50 items-center justify-center border border-border">
                                                    <User className="h-4 w-4 text-foreground/70" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-mono font-bold text-sm md:text-base text-foreground truncate">
                                                            @{entry.username}
                                                        </div>
                                                        {entry.githubUsername && (
                                                            <a href={`https://github.com/${entry.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                                                            </a>
                                                        )}
                                                        {entry.linkedinUrl && (
                                                            <a href={entry.linkedinUrl.startsWith('http') ? entry.linkedinUrl : `https://${entry.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                    {entry.fullName && (
                                                        <div className="font-mono text-[10px] md:text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                                                            {entry.fullName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-3 md:col-span-3 text-right">
                                                <div className="inline-flex items-center justify-center bg-muted/50 border border-border px-3 py-1 rounded-sm w-full md:w-auto">
                                                    <span className="font-mono font-bold text-sm md:text-lg text-foreground tabular-nums tracking-tighter">
                                                        {entry.totalScore}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, MessageSquare } from 'lucide-react';
import { communityService } from '@/services/communityService';


interface Stats {
    totalPosts: number;
    activeUsers: number;
}

interface TrendingTag {
    tag: string;
    count: number;
}

interface CommunitySidebarProps {
    onTagClick?: (tag: string) => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ onTagClick }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, tagsData] = await Promise.all([
                    communityService.getStats(),
                    communityService.getTrendingTags()
                ]);
                setStats(statsData);
                setTrendingTags(tagsData);
            } catch (error) {
                console.error("Failed to load sidebar data", error);
            }
        };
        loadData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Stats Card */}
            <Card className="dark:bg-[#0f172a] dark:border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Community Stats
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-primary">{stats?.totalPosts || 0}</div>
                            <div className="text-xs text-muted-foreground">Total Posts</div>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-primary">{stats?.activeUsers || 0}</div>
                            <div className="text-xs text-muted-foreground">Active Users</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trending Tags */}
            <Card className="dark:bg-[#0f172a] dark:border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Trending Recently
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {trendingTags.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No trending topics yet.</p>
                        ) : (
                            trendingTags.map((tag) => (
                                <Badge
                                    key={tag.tag}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1 text-sm font-normal"
                                    onClick={() => onTagClick?.(tag.tag)}
                                >
                                    #{tag.tag}
                                    <span className="ml-1.5 text-xs text-muted-foreground bg-black/5 dark:bg-white/10 px-1.5 rounded-full">
                                        {tag.count}
                                    </span>
                                </Badge>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Guidelines (Static) */}
            <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Community Guidelines
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-600 dark:text-blue-400 space-y-2">
                    <p>1. Be respectful and kind to others.</p>
                    <p>2. No hate speech or harassment.</p>
                    <p>3. Keep discussions relevant.</p>
                    <Button variant="link" className="h-auto p-0 text-blue-700 dark:text-blue-300 font-semibold">
                        Read full guidelines →
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

import { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Link, useNavigate } from "react-router-dom";
import { chatService, type AIReport } from '@/services/chatService';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Brain,
    Heart,
    PhoneCall,
    Sunrise,
    Sun,
    Moon,
    Activity,
    Users
} from "lucide-react";

export default function OverviewPage() {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [reports, setReports] = useState<AIReport[]>([]);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const data = await chatService.getReports();
                setReports(data.slice(0, 5)); // Only show last 5 in overview
            } catch (e) {
                console.error("Failed to load history on overview");
            }
        };
        loadReports();
    }, []);

    // Get time of day for personalized greeting
    const hour = new Date().getHours();
    let greeting = "Good evening";
    let TimeIcon = Moon;
    let greetingColor = "from-indigo-500 to-purple-500";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
        TimeIcon = Sunrise;
        greetingColor = "from-amber-400 to-orange-500";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
        TimeIcon = Sun;
        greetingColor = "from-blue-400 to-cyan-500";
    }

    // const moods = [
    //     { icon: "😭", label: "Struggling", value: 1, color: "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50" },
    //     { icon: "🙁", label: "Down", value: 2, color: "hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/50" },
    //     { icon: "😐", label: "Okay", value: 3, color: "hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/50" },
    //     { icon: "🙂", label: "Good", value: 4, color: "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50" },
    //     { icon: "😄", label: "Great", value: 5, color: "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/50" },
    // ];

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header / Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-card dark:bg-[#0f172a] border border-border/50 dark:border-slate-800 shadow-sm">
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${greetingColor} opacity-10 rounded-full blur-3xl -mr-20 -mt-20`} />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl -ml-10 -mb-10" />

                <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                    <div className="space-y-3 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <TimeIcon className="h-6 w-6 text-muted-foreground" />
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                {greeting}, <span className={`bg-gradient-to-r ${greetingColor} bg-clip-text text-transparent`}>{user?.fullName?.split(' ')[0] || "Friend"}</span>.
                            </h1>
                        </div>
                        {/* <p className="text-muted-foreground text-lg max-w-xl">
                            Take a deep breath. You are in a safe space.
                            How are you feeling in this moment?
                        </p> */}
                    </div>

                    {/* Mood Tracker */}
                    {/* <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border/50 shadow-sm w-full md:w-auto">
                        <div className="flex justify-between md:justify-center gap-2 sm:gap-4">
                            {moods.map((mood) => (
                                <button
                                    key={mood.value}
                                    onClick={() => setSelectedMood(mood.value)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 border border-transparent
                                        ${selectedMood === mood.value ? 'bg-primary/10 border-primary/30 scale-110 shadow-sm' : 'hover:scale-105 ' + mood.color}
                                    `}
                                >
                                    <span className="text-3xl filter drop-shadow-sm">{mood.icon}</span>
                                    <span className={`text-xs font-medium ${selectedMood === mood.value ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {mood.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div> */}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/dashboard/chat" className="group">
                    <Card className="h-full border border-primary/20 dark:border-slate-800 bg-primary/5 dark:bg-[#0f172a] hover:bg-primary/10 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 group-hover:-translate-y-1">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Brain className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">AI Therapy Session</h3>
                                <p className="text-sm text-muted-foreground mt-1">Start a private diagnostic conversation</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/community" className="group">
                    <Card className="h-full border border-border/50 dark:border-slate-800 dark:bg-[#0f172a] hover:border-border transition-all duration-300 hover:shadow-sm group-hover:-translate-y-1">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">College Community</h3>
                                <p className="text-sm text-muted-foreground mt-1">Connect with supportive peers</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/assessment-history" className="group">
                    <Card className="h-full border border-border/50 dark:border-slate-800 dark:bg-[#0f172a] hover:border-border transition-all duration-300 hover:shadow-sm group-hover:-translate-y-1">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">My Progress</h3>
                                <p className="text-sm text-muted-foreground mt-1">View past reports and severity trends</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Emergency Contact */}
                <Card className="h-full border border-red-500/20 dark:border-slate-800 dark:bg-[#0f172a] bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-all duration-300 hover:shadow-md hover:shadow-red-500/5">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-600 animate-pulse">
                            <PhoneCall className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-600">Emergency Help</h3>
                            <p className="text-sm text-red-600/80 mt-1">Immediate campus & crisis contacts</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section - Empty State for future integration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 border-border/50 dark:border-slate-800 shadow-sm bg-card dark:bg-[#0f172a]">
                    <div className="p-6 flex items-center justify-between border-b border-border/50 dark:border-slate-800">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Recent Well-being
                        </h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/dashboard/assessment-history">View History</Link>
                        </Button>
                    </div>
                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[250px] text-center text-muted-foreground">
                        {reports.length > 0 ? (
                            <div className="w-full flex items-end gap-3 h-32 px-4 pb-2">
                                {[...reports].reverse().map((r) => (
                                    <div
                                        key={r.id}
                                        onClick={() => navigate(`/dashboard/report/${r.id}`)}
                                        className="flex-1 flex flex-col items-center justify-end gap-2 h-full cursor-pointer group"
                                    >
                                        <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6">
                                            {r.combinedSeverityScore}/10
                                        </span>
                                        <div className="w-full relative h-full flex items-end">
                                            <div
                                                className={`w-full rounded-t-md transition-all group-hover:brightness-110 ${r.combinedSeverityScore <= 3 ? 'bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                                                    r.combinedSeverityScore <= 6 ? 'bg-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                                                        r.combinedSeverityScore <= 8 ? 'bg-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.3)]' :
                                                            'bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                                    }`}
                                                style={{ height: `${(r.combinedSeverityScore / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <LineChartPlaceholder />
                                <p className="mt-4 text-sm">Your severity tracking chart will appear here after multiple sessions.</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-border/50 dark:border-slate-800 shadow-sm bg-card dark:bg-[#0f172a]">
                    <div className="p-6 border-b border-border/50 dark:border-slate-800">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-500" />
                            Recommended Today
                        </h2>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        {/* Mock Recommendation items */}
                        <div className="p-4 rounded-xl bg-muted/50 dark:bg-slate-800/50 border border-border/30 dark:border-slate-700 hover:border-primary/30 transition-colors group cursor-pointer">
                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors text-foreground dark:text-slate-100">5-Minute Box Breathing</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">A quick exercise to steady your heart rate and ground your racing thoughts.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 dark:bg-slate-800/50 border border-border/30 dark:border-slate-700 hover:border-primary/30 transition-colors group cursor-pointer">
                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors text-foreground dark:text-slate-100">Journaling Prompt</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">"What is one thing strictly within my control today?"</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

// Simple decorative SVG placeholder so the chart box isn't literally empty
function LineChartPlaceholder() {
    return (
        <svg className="w-full max-w-[300px] h-24 text-muted border-b border-l border-muted-foreground/20 p-2" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 35 L20 25 L40 28 L60 15 L80 20 L100 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 35 L20 25 L40 28 L60 15 L80 20 L100 5 L100 40 L0 40 Z" fill="currentColor" className="opacity-10" />
            <circle cx="20" cy="25" r="1.5" fill="currentColor" />
            <circle cx="40" cy="28" r="1.5" fill="currentColor" />
            <circle cx="60" cy="15" r="1.5" fill="currentColor" />
            <circle cx="80" cy="20" r="1.5" fill="currentColor" />
            <circle cx="100" cy="5" r="1.5" fill="currentColor" className="text-primary opacity-50" />
        </svg>
    )
}


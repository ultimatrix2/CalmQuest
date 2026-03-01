import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService, type AIReport } from '@/services/chatService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Brain,
    Activity,
    Calendar,
    FileText,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Minus,
    ArrowLeft,
} from 'lucide-react';

const getSeverityColor = (score: number) => {
    if (score <= 3) return 'text-green-500';
    if (score <= 6) return 'text-yellow-500';
    if (score <= 8) return 'text-orange-500';
    return 'text-red-500';
};

const getSeverityBg = (score: number) => {
    if (score <= 3) return 'bg-green-500/10 border-green-500/20';
    if (score <= 6) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score <= 8) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
};

const getSeverityLabel = (score: number) => {
    if (score <= 3) return 'Mild';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Significant';
    return 'Severe';
};

const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const AssessmentHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<AIReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const data = await chatService.getReports();
                setReports(data);
            } catch {
                setReports([]);
            } finally {
                setLoading(false);
            }
        };
        loadReports();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Assessment History</h1>
                    <p className="text-sm text-muted-foreground">
                        Track your well-being over time
                    </p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">No Assessments Yet</h2>
                        <p className="text-muted-foreground text-sm">
                            Your well-being check history will appear here after you complete your first
                            assessment through the AI chat.
                        </p>
                        <Button onClick={() => navigate('/dashboard/chat')} className="gap-2">
                            <Brain className="h-4 w-4" />
                            Start a Conversation
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardContent className="pt-4 text-center">
                                <p className="text-2xl font-bold">{reports.length}</p>
                                <p className="text-xs text-muted-foreground">Total Assessments</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardContent className="pt-4 text-center">
                                <p className={`text-2xl font-bold ${getSeverityColor(reports[0]?.combinedSeverityScore || 0)}`}>
                                    {reports[0]?.combinedSeverityScore || '-'}/10
                                </p>
                                <p className="text-xs text-muted-foreground">Latest Score</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardContent className="pt-4 text-center">
                                <p className="text-2xl font-bold">
                                    {Math.min(...reports.map(r => r.combinedSeverityScore))}/10
                                </p>
                                <p className="text-xs text-muted-foreground">Best Score</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardContent className="pt-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    {getTrendIcon(
                                        reports[0]?.combinedSeverityScore || 0,
                                        reports[1]?.combinedSeverityScore
                                    )}
                                    <p className="text-sm font-medium">
                                        {reports.length >= 2
                                            ? reports[0].combinedSeverityScore <= reports[1].combinedSeverityScore
                                                ? 'Improving'
                                                : 'Needs attention'
                                            : 'First assessment'
                                        }
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Trend</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Severity Timeline (Simple) */}
                    {reports.length > 1 && (
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardContent className="pt-4">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Severity Over Time
                                </h3>
                                <div className="flex items-end gap-2 h-24">
                                    {[...reports].reverse().map((r) => (
                                        <div key={r.id} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                                            <div className="w-full relative h-full flex items-end">
                                                <div
                                                    className={`w-full rounded-t-sm transition-all ${r.combinedSeverityScore <= 3 ? 'bg-green-500' :
                                                        r.combinedSeverityScore <= 6 ? 'bg-yellow-500' :
                                                            r.combinedSeverityScore <= 8 ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ height: `${(r.combinedSeverityScore / 10) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reports List */}
                    <div className="space-y-3">
                        {reports.map((report, index) => (
                            <button
                                key={report.id}
                                onClick={() => navigate(`/dashboard/report/${report.id}`)}
                                className="w-full text-left"
                            >
                                <Card className={`hover:shadow-md transition-all border ${getSeverityBg(report.combinedSeverityScore)}`}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.combinedSeverityScore <= 3 ? 'bg-green-500/20' :
                                                    report.combinedSeverityScore <= 6 ? 'bg-yellow-500/20' :
                                                        report.combinedSeverityScore <= 8 ? 'bg-orange-500/20' : 'bg-red-500/20'
                                                    }`}>
                                                    <span className={`text-lg font-bold ${getSeverityColor(report.combinedSeverityScore)}`}>
                                                        {report.combinedSeverityScore}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {getSeverityLabel(report.combinedSeverityScore)} Concern
                                                        {index === 0 && (
                                                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(report.createdAt).toLocaleDateString(undefined, {
                                                                year: 'numeric', month: 'short', day: 'numeric'
                                                            })}
                                                        </span>
                                                        {report.ghq12Score !== undefined && <span>GHQ: {report.ghq12Score}</span>}
                                                        {report.phq9Score !== undefined && <span>PHQ: {report.phq9Score}</span>}
                                                        {report.gad7Score !== undefined && <span>GAD: {report.gad7Score}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {index > 0 && getTrendIcon(report.combinedSeverityScore, reports[index - 1]?.combinedSeverityScore)}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentHistoryPage;

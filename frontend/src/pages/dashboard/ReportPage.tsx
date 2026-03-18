import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { chatService, type AIReport } from '@/services/chatService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Loader2,
    Brain,
    Activity,
    AlertTriangle,
    ArrowLeft,
    Heart,
    Smile,
    ShieldAlert,
    TrendingUp,
    Calendar,
    FileText,
    Download,
} from 'lucide-react';

// Severity color helpers
const getSeverityColor = (score: number) => {
    if (score <= 3) return 'text-green-500';
    if (score <= 6) return 'text-yellow-500';
    if (score <= 8) return 'text-orange-500';
    return 'text-red-500';
};

const getSeverityBg = (score: number) => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 6) return 'bg-yellow-500';
    if (score <= 8) return 'bg-orange-500';
    return 'bg-red-500';
};

const getSeverityLabel = (score: number) => {
    if (score <= 3) return 'Mild';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Significant';
    return 'Severe';
};

const getActionIcon = (action?: string) => {
    switch (action) {
        case 'SELF_HELP': return <Smile className="h-5 w-5 text-green-500" />;
        case 'SUGGEST_DOCTOR': return <Heart className="h-5 w-5 text-yellow-500" />;
        case 'URGENT_REFERRAL': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        case 'CRISIS_INTERVENTION': return <ShieldAlert className="h-5 w-5 text-red-500" />;
        default: return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
};

// Score gauge component
const ScoreGauge: React.FC<{ label: string; score?: number; maxScore: number; testName: string }> = ({
    label, score, maxScore, testName,
}) => {
    if (score === undefined || score === null) return null;
    const percentage = (score / maxScore) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">{score}/{maxScore}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getSeverityBg(
                        (score / maxScore) * 10
                    )}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground">{testName}</p>
        </div>
    );
};

const ReportPage: React.FC = () => {
    const { reportId } = useParams<{ reportId?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentIdParam = searchParams.get('studentId');

    const [report] = useState<AIReport | null>(null);
    const [reports, setReports] = useState<AIReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownloadPdf = () => {
        if (!reportRef.current) return;

        const opt = {
            margin: 0.5,
            filename: 'calmquest-report.pdf',
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in' as const, format: 'letter', orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(reportRef.current).save();
    };

    useEffect(() => {
        const loadReports = async () => {
            try {
                let data;
                if (studentIdParam) {
                    data = await chatService.getStudentReports(Number(studentIdParam));
                } else {
                    data = await chatService.getReports();
                }
                setReports(data || []);
                if (data && data.length > 0) {
                    if (reportId) {
                        const found = data.find((r: AIReport) => r.id === Number(reportId));
                        setSelectedReport(found || data[0] || null);
                    } else {
                        setSelectedReport(data[0]);
                    }
                }
            } catch {
                setReports([]);
            } finally {
                setLoading(false);
            }
        };
        loadReports();
    }, [reportId, studentIdParam]);

    const displayReport = selectedReport || report;

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // No reports yet
    if (!displayReport && reports.length === 0) {
        return (
            <div className="container mx-auto py-6 px-4 max-w-4xl">
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">No Reports Yet</h2>
                        <p className="text-muted-foreground text-sm">
                            Complete a well-being check in the Chat to generate your first AI report.
                            Your report will include assessment scores, emotion analysis, and personalized recommendations.
                        </p>
                        <Button onClick={() => navigate('/dashboard/chat')} className="gap-2">
                            <Brain className="h-4 w-4" />
                            Start a Conversation
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Console log the report to verify all 5 parameters are present
    console.log("Generated Report Data (All Parameters):", displayReport);

    return (
        <div className="container mx-auto py-6 px-4 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Report</h1>
                        <p className="text-sm text-muted-foreground">
                            Your mental well-being assessment summary
                        </p>
                    </div>
                </div>
                {displayReport && (
                    <Button onClick={handleDownloadPdf} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                )}
            </div>

            {displayReport && (
                <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2 bg-background/50 rounded-xl">
                    {/* Main Report */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Combined Severity */}
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
                                    <Activity className="h-5 w-5" />
                                    Overall Well-being Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-24 h-24">
                                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                                                className="text-muted" strokeWidth="8" />
                                            <circle cx="50" cy="50" r="40" fill="none"
                                                className={getSeverityColor(displayReport.combinedSeverityScore)}
                                                strokeWidth="8" strokeLinecap="round"
                                                strokeDasharray={`${(displayReport.combinedSeverityScore / 10) * 251} 251`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-2xl font-bold ${getSeverityColor(displayReport.combinedSeverityScore)}`}>
                                                {displayReport.combinedSeverityScore}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={`text-lg font-semibold ${getSeverityColor(displayReport.combinedSeverityScore)}`}>
                                            {getSeverityLabel(displayReport.combinedSeverityScore)} Concern
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Based on assessments, conversation analysis, and behavioral indicators
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Test Scores */}
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
                                    <TrendingUp className="h-5 w-5" />
                                    Assessment Scores
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <ScoreGauge label="GHQ-12" score={displayReport.ghq12Score} maxScore={12} testName="General Health Questionnaire" />
                                <ScoreGauge label="PHQ-9" score={displayReport.phq9Score} maxScore={27} testName="Patient Health Questionnaire (Depression)" />
                                <ScoreGauge label="GAD-7" score={displayReport.gad7Score} maxScore={21} testName="Generalized Anxiety Disorder" />
                            </CardContent>
                        </Card>

                        {/* Summary & Recommendations */}
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
                                    {getActionIcon(displayReport.actionTaken)}
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {displayReport.summary && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium dark:text-slate-200">Summary</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {displayReport.summary}
                                        </p>
                                    </div>
                                )}
                                <Separator />
                                {displayReport.recommendedActions && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium dark:text-slate-200">Recommended Actions</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {displayReport.recommendedActions}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Facial Expression Tracking */}
                        {(displayReport.facialDistressScore !== undefined || displayReport.facialSummary) && (
                            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                                <CardHeader className="pb-3 border-b border-border/50 dark:border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2 dark:text-slate-100 font-semibold">
                                            <Smile className="h-4 w-4" />
                                            Facial Expression Tracking
                                        </CardTitle>
                                        {displayReport.facialDistressScore !== undefined && (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSeverityBg(displayReport.facialDistressScore)} text-white`}>
                                                Distress {Math.round(displayReport.facialDistressScore)}/10
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {displayReport.emotionBreakdown && Object.keys(displayReport.emotionBreakdown).length > 0 && (
                                        <div className="space-y-3">
                                            {/* Joy & Sadness Header */}
                                            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium mb-1">
                                                <span>Joy</span>
                                                <span className="text-center">Sadness</span>
                                                <span className="text-center">Anger</span>
                                                <span className="text-right">Fear</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-sm font-bold mb-4">
                                                <span>{Math.round((displayReport.emotionBreakdown.happy || 0) * 100)}%</span>
                                                <span className="text-center text-green-500">{Math.round((displayReport.emotionBreakdown.sad || 0) * 100)}%</span>
                                                <span className="text-center text-red-500">{Math.round((displayReport.emotionBreakdown.angry || 0) * 100)}%</span>
                                                <span className="text-right text-orange-500">{Math.round((displayReport.emotionBreakdown.fearful || 0) * 100)}%</span>
                                            </div>

                                            {/* Detailed Bars */}
                                            {Object.entries(displayReport.emotionBreakdown)
                                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                                .slice(0, 3) // Top 3
                                                .map(([emotion, value]) => (
                                                    <div key={emotion} className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="capitalize font-medium">{emotion}</span>
                                                            <span className="font-bold">{Math.round((value as number) * 100)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${emotion === 'happy' ? 'bg-blue-400' : emotion === 'sad' ? 'bg-green-400' : emotion === 'angry' ? 'bg-red-400' : 'bg-purple-400'}`}
                                                                style={{ width: `${(value as number) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    {(!displayReport.emotionBreakdown || Object.keys(displayReport.emotionBreakdown).length === 0) && !displayReport.facialSummary && (
                                        <div className="text-center py-4 bg-muted/20 rounded-lg">
                                            <p className="text-xs text-muted-foreground">No facial data recorded</p>
                                        </div>
                                    )}
                                    {displayReport.facialSummary && (
                                        <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                            {displayReport.facialSummary}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Voice Tone Tracking */}
                        {(displayReport.voiceDistressScore !== undefined || displayReport.voiceSummary) && (
                            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                                <CardHeader className="pb-3 border-b border-border/50 dark:border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2 dark:text-slate-100 font-semibold">
                                            <Activity className="h-4 w-4" />
                                            Voice Tone Tracking
                                        </CardTitle>
                                        {displayReport.voiceDistressScore !== undefined && (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSeverityBg(displayReport.voiceDistressScore)} text-white`}>
                                                Distress {Math.round(displayReport.voiceDistressScore)}/10
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {displayReport.voiceSummary ? (
                                        <div className="p-3 bg-muted/30 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                            {displayReport.voiceSummary}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-muted/20 rounded-lg">
                                            <p className="text-xs text-muted-foreground">No voice data recorded</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Text Sentiment */}
                        {(displayReport.sentimentDistressScore !== undefined || displayReport.sentimentSummary) && (
                            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                                <CardHeader className="pb-3 border-b border-border/50 dark:border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2 dark:text-slate-100 font-semibold">
                                            <FileText className="h-4 w-4" />
                                            Text Sentiment
                                        </CardTitle>
                                        {displayReport.sentimentDistressScore !== undefined && (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSeverityBg(displayReport.sentimentDistressScore)} text-white`}>
                                                Distress {Math.round(displayReport.sentimentDistressScore)}/10
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {displayReport.sentimentSummary && (
                                        <div className="p-3 bg-muted/30 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                            {displayReport.sentimentSummary}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Cognitive Patterns */}
                        {displayReport.cognitivePatterns && (
                            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2 dark:text-slate-100">
                                        <Brain className="h-4 w-4" />
                                        Thinking Patterns
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {displayReport.cognitivePatterns}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Date */}
                        <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        Generated {new Date(displayReport.createdAt).toLocaleDateString(undefined, {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>


                    </div>
                </div>
            )}

            {/* Report list if multiple */}
            {reports.length > 1 && (
                <div className="mt-8">
                    <Separator className="mb-6" />
                    <h3 className="font-semibold mb-4">Previous Reports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reports.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedReport(r)}
                                className={`text-left p-4 rounded-lg border dark:border-slate-700 transition-colors hover:bg-accent/50 dark:hover:bg-slate-800 dark:bg-[#0f172a] ${selectedReport?.id === r.id ? 'border-primary bg-accent/30 dark:bg-slate-800' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-lg font-bold ${getSeverityColor(r.combinedSeverityScore)}`}>
                                        {r.combinedSeverityScore}/10
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {getSeverityLabel(r.combinedSeverityScore)} • {r.actionTaken?.replace(/_/g, ' ')}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportPage;

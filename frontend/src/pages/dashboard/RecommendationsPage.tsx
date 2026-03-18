import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authService, type DailyRecommendation } from "@/services/authService"
import { toast } from "sonner"
import { Sparkles, History, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

export default function RecommendationsPage() {
    const [todayRec, setTodayRec] = useState<DailyRecommendation | null>(null)
    const [history, setHistory] = useState<DailyRecommendation[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        loadRecommendations()
    }, [])

    const loadRecommendations = async () => {
        setLoading(true)
        try {
            const today = await authService.getTodayRecommendation()
            setTodayRec(today)
            const hist = await authService.getRecommendationHistory()
            setHistory(hist)
        } catch {
            // silently fail
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            const rec = await authService.generateRecommendation()
            if (rec) {
                setTodayRec(rec)
                toast.success("New recommendations generated! 🌟")
                loadRecommendations()
            } else {
                toast.error("Complete an assessment first to get personalized recommendations.")
            }
        } catch {
            toast.error("Failed to generate recommendations")
        } finally {
            setGenerating(false)
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "MINDFULNESS": return "🧘"
            case "ACTIVITY": return "🏃"
            case "SOCIAL": return "🤝"
            case "PROFESSIONAL": return "🏥"
            case "SELF_CARE": return "💚"
            default: return "✨"
        }
    }

    const getSeverityColor = (score: number) => {
        if (score >= 7) return "text-red-500"
        if (score >= 4) return "text-yellow-500"
        return "text-green-500"
    }

    const getSeverityLabel = (score: number) => {
        if (score >= 7) return "Needs Attention"
        if (score >= 4) return "Moderate"
        return "Good"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Sparkles className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-muted-foreground">Loading recommendations...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Daily Recommendations
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Personalized wellness tips based on your assessments
                    </p>
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    variant="outline"
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                    {generating ? "Generating..." : "Generate Now"}
                </Button>
            </div>

            {/* Today's Recommendation */}
            {todayRec ? (
                <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="text-2xl">{getCategoryIcon(todayRec.category)}</span>
                                Today's Wellness Plan
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${getSeverityColor(todayRec.severityScore)}`}>
                                    {getSeverityLabel(todayRec.severityScore)}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${todayRec.severityScore >= 7 ? "bg-red-500" : todayRec.severityScore >= 4 ? "bg-yellow-500" : "bg-green-500"}`} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                            {todayRec.recommendations}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            Generated: {new Date(todayRec.generatedAt).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No Recommendations Yet</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Complete a mental health assessment to receive AI-powered personalized wellness recommendations.
                        </p>
                        <Button onClick={handleGenerate} disabled={generating} className="mt-4 gap-2">
                            <Sparkles className="h-4 w-4" />
                            Generate Recommendations
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* History */}
            {history.length > 1 && (
                <div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                        <History className="h-4 w-4" />
                        Past Recommendations ({history.length - (todayRec ? 1 : 0)})
                        {showHistory ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                    </button>

                    {showHistory && (
                        <div className="space-y-3 mt-3">
                            {history
                                .filter(r => !todayRec || r.id !== todayRec.id)
                                .map(rec => (
                                    <Card key={rec.id} className="opacity-80 hover:opacity-100 transition-opacity">
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    {getCategoryIcon(rec.category)}
                                                    {new Date(rec.generatedAt).toLocaleDateString('en-US', {
                                                        weekday: 'short', month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                                <span className={`text-xs ${getSeverityColor(rec.severityScore)}`}>
                                                    {getSeverityLabel(rec.severityScore)}
                                                </span>
                                            </div>
                                            <div className="whitespace-pre-line text-xs text-muted-foreground line-clamp-3">
                                                {rec.recommendations}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

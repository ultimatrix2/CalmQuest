import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, LineChart, Moon, Smile, Target, Wind } from "lucide-react"

const features = [
    {
        icon: Smile,
        title: "Mood Tracking",
        description: "Log your daily emotions and identify patterns to better understand your mental health journey.",
    },
    {
        icon: Wind,
        title: "Guided Breathing",
        description: "Practice calming breathing exercises designed to reduce stress and anxiety in minutes.",
    },
    {
        icon: Moon,
        title: "Sleep Stories",
        description: "Drift off peacefully with soothing bedtime stories and ambient soundscapes.",
    },
    {
        icon: Target,
        title: "Daily Goals",
        description: "Set and achieve wellness goals with personalized recommendations and streaks.",
    },
    {
        icon: LineChart,
        title: "Progress Insights",
        description: "Visualize your wellness journey with beautiful charts and actionable insights.",
    },
    {
        icon: Heart,
        title: "Self-Care Tips",
        description: "Receive personalized self-care suggestions based on your mood and preferences.",
    },
]

export function Features() {
    return (
        <section id="features" className="py-20 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Everything You Need for
                        <span className="text-primary"> Mental Wellness</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Comprehensive tools and features designed to support your mental health journey every step of the way.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

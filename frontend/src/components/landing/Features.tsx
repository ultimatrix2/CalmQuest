import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, LineChart, Moon, Smile, Target, Wind } from "lucide-react"

const features = [
    {
        icon: Smile,
        title: "Mood Tracking",
        description: "Log your daily emotions and identify patterns to better understand your mental health journey.",
        gradient: "from-primary to-[hsl(200,80%,55%)]",
    },
    {
        icon: Wind,
        title: "Guided Breathing",
        description: "Practice calming breathing exercises designed to reduce stress and anxiety in minutes.",
        gradient: "from-[hsl(200,80%,55%)] to-[hsl(270,60%,65%)]",
    },
    {
        icon: Moon,
        title: "Sleep Stories",
        description: "Drift off peacefully with soothing bedtime stories and ambient soundscapes.",
        gradient: "from-[hsl(270,60%,65%)] to-[hsl(300,50%,60%)]",
    },
    {
        icon: Target,
        title: "Daily Goals",
        description: "Set and achieve wellness goals with personalized recommendations and streaks.",
        gradient: "from-accent to-[hsl(35,90%,60%)]",
    },
    {
        icon: LineChart,
        title: "Progress Insights",
        description: "Visualize your wellness journey with beautiful charts and actionable insights.",
        gradient: "from-[hsl(35,90%,60%)] to-primary",
    },
    {
        icon: Heart,
        title: "Self-Care Tips",
        description: "Receive personalized self-care suggestions based on your mood and preferences.",
        gradient: "from-[hsl(350,70%,60%)] to-accent",
    },
]

export function Features() {
    return (
        <section id="features" className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Everything You Need for
                        <span className="gradient-primary text-gradient"> Mental Wellness</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Comprehensive tools and features designed to support your mental health journey every step of the way.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <Card key={feature.title} className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <feature.icon className="h-7 w-7 text-white" />
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base leading-relaxed">
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

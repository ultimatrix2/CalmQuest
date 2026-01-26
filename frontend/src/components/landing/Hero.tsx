import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/20 via-blue-400/10 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
                        <Sparkles className="h-4 w-4" />
                        Your Journey to Inner Peace Starts Here
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                        Find Your
                        <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            {" "}Calm{" "}
                        </span>
                        in the Chaos
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        CalmQuest is your personal mental wellness companion. Track your mood,
                        practice mindfulness, and build healthy habits for a balanced life.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="text-base px-8">
                            Start Your Journey
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="text-base px-8">
                            Learn More
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t max-w-lg mx-auto">
                        <div>
                            <div className="text-3xl font-bold text-primary">10K+</div>
                            <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">4.9</div>
                            <div className="text-sm text-muted-foreground">App Rating</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">100+</div>
                            <div className="text-sm text-muted-foreground">Meditations</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Heart } from "lucide-react"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/30 via-[hsl(200,80%,55%)]/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[hsl(270,60%,65%)]/20 via-accent/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-secondary/30 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-[hsl(270,60%,65%)]/10 rounded-full border border-primary/20 text-sm font-medium mb-8">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="gradient-primary text-gradient">Your Journey to Inner Peace Starts Here</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                        Find Your
                        <span className="gradient-primary text-gradient">
                            {" "}Calm{" "}
                        </span>
                        in the
                        <span className="gradient-accent text-gradient">
                            {" "}Chaos
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        CalmQuest is your personal mental wellness companion. Track your mood,
                        practice mindfulness, and build healthy habits for a balanced, joyful life.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="text-base px-8 bg-gradient-to-r from-primary via-[hsl(200,80%,55%)] to-[hsl(270,60%,65%)] hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                            Start Your Journey
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="text-base px-8 border-2 hover:bg-secondary/50">
                            <Heart className="mr-2 h-5 w-5 text-accent" />
                            Learn More
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50 max-w-lg mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-primary text-gradient">10K+</div>
                            <div className="text-sm text-muted-foreground mt-1">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-accent text-gradient">4.9</div>
                            <div className="text-sm text-muted-foreground mt-1">App Rating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-primary text-gradient">100+</div>
                            <div className="text-sm text-muted-foreground mt-1">Meditations</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

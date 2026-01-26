import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { FieldDescription } from "@/components/ui/field"
import { Brain } from "lucide-react"
import { Link } from "react-router-dom"

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)

    return (
        <div className="min-h-svh bg-muted/30 flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-[var(--gradient-blue)] to-[var(--gradient-purple)] flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold gradient-primary text-gradient">CalmQuest</span>
                </Link>
                <ThemeToggle />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl">
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="relative min-h-[600px] md:min-h-[650px]">
                                {/* Sliding container */}
                                <div
                                    className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                                    style={{ transform: isLogin ? 'translateX(0)' : 'translateX(-50%)' }}
                                >
                                    {/* Login Panel (left) + Image (right) */}
                                    <div className="w-full md:w-[200%] flex flex-shrink-0">
                                        {/* Login Form */}
                                        <div className="w-full md:w-1/4 flex items-center justify-center bg-card p-4">
                                            <div className="w-full max-w-sm">
                                                <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
                                            </div>
                                        </div>

                                        {/* Sliding Image Panel */}
                                        <div className="hidden md:flex w-1/4 bg-gradient-to-br from-primary/20 via-[var(--gradient-blue)]/30 to-[var(--gradient-purple)]/20 items-center justify-center relative overflow-hidden">
                                            <div
                                                className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                                                style={{ transform: isLogin ? 'translateX(0)' : 'translateX(-100%)' }}
                                            >
                                                {/* Login side image content */}
                                                <div className="w-full flex-shrink-0 flex items-center justify-center p-8">
                                                    <div className="text-center">
                                                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-[var(--gradient-blue)] to-[var(--gradient-purple)] flex items-center justify-center mb-6 shadow-2xl">
                                                            <Brain className="h-10 w-10 text-white" />
                                                        </div>
                                                        <h2 className="text-xl font-bold mb-2 gradient-primary text-gradient">Welcome Back!</h2>
                                                        <p className="text-muted-foreground text-sm">Continue your wellness journey</p>
                                                    </div>
                                                </div>
                                                {/* Signup side image content */}
                                                <div className="w-full flex-shrink-0 flex items-center justify-center p-8">
                                                    <div className="text-center">
                                                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--gradient-coral)] via-[var(--gradient-orange)] to-primary flex items-center justify-center mb-6 shadow-2xl">
                                                            <Brain className="h-10 w-10 text-white" />
                                                        </div>
                                                        <h2 className="text-xl font-bold mb-2 gradient-accent text-gradient">Join CalmQuest</h2>
                                                        <p className="text-muted-foreground text-sm">Start your path to inner peace</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Signup Form */}
                                        <div className="w-full md:w-1/4 flex items-center justify-center bg-card p-4">
                                            <div className="w-full max-w-sm">
                                                <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
                                            </div>
                                        </div>

                                        {/* Right side placeholder for balance */}
                                        <div className="hidden md:block w-1/4 bg-gradient-to-br from-[var(--gradient-coral)]/20 via-[var(--gradient-orange)]/30 to-primary/20" />
                                    </div>
                                </div>

                                {/* Mobile view - simple toggle */}
                                <div className="md:hidden absolute inset-0">
                                    <div
                                        className="h-full transition-opacity duration-300"
                                        style={{ opacity: isLogin ? 1 : 0, pointerEvents: isLogin ? 'auto' : 'none' }}
                                    >
                                        <div className="h-full flex items-center justify-center p-4">
                                            <div className="w-full max-w-sm">
                                                <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="absolute inset-0 h-full transition-opacity duration-300"
                                        style={{ opacity: isLogin ? 0 : 1, pointerEvents: isLogin ? 'none' : 'auto' }}
                                    >
                                        <div className="h-full flex items-center justify-center p-4">
                                            <div className="w-full max-w-sm">
                                                <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <FieldDescription className="px-6 pt-4 text-center">
                        By continuing, you agree to our{" "}
                        <a href="#" className="text-primary">Terms of Service</a> and{" "}
                        <a href="#" className="text-primary">Privacy Policy</a>.
                    </FieldDescription>
                </div>
            </div>
        </div>
    )
}

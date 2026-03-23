import { useState } from "react"
import { authService } from "@/services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        
        try {
            await authService.forgotPassword(email)
            setIsSuccess(true)
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-svh bg-muted/30 flex flex-col items-center justify-center p-6">
            <div className="absolute top-4 right-4"><ThemeToggle /></div>
            
            <Link to="/" className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-[var(--gradient-blue)] to-[var(--gradient-purple)] flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold gradient-primary text-gradient text-xl">CalmQuest</span>
            </Link>

            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        {isSuccess 
                            ? "Check your email for the reset link." 
                            : "Enter your email address to receive a secure password reset link."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="flex flex-col items-center py-6 text-center text-muted-foreground">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                            <p>We've sent a password reset link to <br/><span className="font-semibold text-foreground">{email}</span></p>
                            <p className="text-sm mt-4">Please check your inbox and spam folder. The link will expire in 10 minutes.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="border-primary/20 focus-visible:ring-primary/50"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                    {error}
                                </div>
                            )}
                            
                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-primary to-[var(--gradient-purple)] hover:opacity-90 transition-opacity" 
                                disabled={isLoading || !email}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : "Send Reset Link"}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/50 pt-4">
                    <Link to="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

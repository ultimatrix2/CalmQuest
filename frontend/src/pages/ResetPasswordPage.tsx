import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { authService } from "@/services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain, ArrowLeft, Loader2, KeyRound } from "lucide-react"

export default function ResetPasswordPage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }
        
        if (!token) {
            setError("Invalid or missing reset token")
            return
        }

        setIsLoading(true)
        setError(null)
        
        try {
            await authService.resetPassword(token, password)
            setIsSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The link might be expired.')
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
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        <KeyRound className="h-6 w-6 text-primary" />
                        Create New Password
                    </CardTitle>
                    <CardDescription>
                        {isSuccess 
                            ? "Your password has been reset successfully." 
                            : "Please enter your new password below."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="flex flex-col items-center py-6 text-center text-muted-foreground">
                            <div className="bg-green-500/20 p-4 rounded-full mb-4">
                                <KeyRound className="h-12 w-12 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Password Updated!</h3>
                            <p className="text-sm">You can now use your new password to log in.</p>
                            
                            <Button 
                                onClick={() => navigate("/login")}
                                className="w-full mt-6 bg-gradient-to-r from-primary to-[var(--gradient-purple)] hover:opacity-90 transition-opacity"
                            >
                                Continue to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="border-primary/20 focus-visible:ring-primary/50"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                disabled={isLoading || !password || !confirmPassword}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : "Reset Password"}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!isSuccess && (
                    <CardFooter className="flex justify-center border-t border-border/50 pt-4">
                        <Link to="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}

import { useState, useRef, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Brain } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { loginStart, loginSuccess, loginFailure } from "@/store/authSlice"
import { authService } from "@/services/authService"
import { toast } from "sonner"

interface LoginFormProps extends React.ComponentProps<"div"> {
    onSwitchToSignup?: () => void
}

export function LoginForm({
    className,
    onSwitchToSignup,
    ...props
}: LoginFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // OTP verification state
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""])
    const [otpLoading, setOtpLoading] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { loading, error } = useAppSelector((state) => state.auth)

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch(loginStart())

        try {
            const response = await authService.login({ email, password })
            if (response.emailVerificationRequired) {
                setShowOtpInput(true)
                setResendCooldown(60)
                toast.success("Verification code sent to your email!")
                dispatch(loginFailure("")) // clear loading state
            } else {
                dispatch(loginSuccess({
                    user: {
                        id: response.id,
                        fullName: response.fullName,
                        email: response.email,
                        role: response.role,
                    },
                    token: response.token,
                }))
                navigate("/dashboard")
            }
        } catch (err) {
            dispatch(loginFailure(err instanceof Error ? err.message : "Login failed"))
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otpValues]
        newOtp[index] = value.slice(-1)
        setOtpValues(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otpValues[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        const newOtp = [...otpValues]
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i]
        }
        setOtpValues(newOtp)
        if (pastedData.length > 0) {
            const focusIndex = Math.min(pastedData.length, 5)
            otpRefs.current[focusIndex]?.focus()
        }
    }

    const handleVerifyOtp = async () => {
        const otp = otpValues.join("")
        if (otp.length !== 6) {
            toast.error("Please enter the complete 6-digit code")
            return
        }

        setOtpLoading(true)
        try {
            const response = await authService.verifyOtp(email, otp)
            toast.success("Email verified successfully! 🎉")
            dispatch(loginSuccess({
                user: {
                    id: response.id,
                    fullName: response.fullName,
                    email: response.email,
                    role: response.role,
                },
                token: response.token,
            }))
            navigate("/dashboard")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed")
            setOtpValues(["", "", "", "", "", ""])
            otpRefs.current[0]?.focus()
        } finally {
            setOtpLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return
        try {
            await authService.resendOtp(email)
            toast.success("New OTP sent to your email!")
            setResendCooldown(60)
            setOtpValues(["", "", "", "", "", ""])
            otpRefs.current[0]?.focus()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to resend OTP")
        }
    }

    if (showOtpInput) {
        return (
            <div className={cn("flex flex-col gap-6 p-6 md:p-8", className)}>
                <FieldGroup>
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-[var(--gradient-blue)] to-[var(--gradient-purple)] flex items-center justify-center shadow-lg">
                            <span className="text-2xl">📧</span>
                        </div>
                        <h2 className="text-xl font-bold">Verify Your Email</h2>
                        <p className="text-muted-foreground text-sm">
                            We've sent a 6-digit code to<br />
                            <span className="font-medium text-foreground">{email}</span>
                        </p>
                    </div>

                    <div className="flex justify-center gap-2 my-4" onPaste={handleOtpPaste}>
                        {otpValues.map((val, idx) => (
                            <input
                                key={idx}
                                ref={(el) => { otpRefs.current[idx] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={val}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="w-11 h-13 text-center text-xl font-bold rounded-lg border-2 border-muted bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                autoFocus={idx === 0}
                            />
                        ))}
                    </div>

                    <Button
                        onClick={handleVerifyOtp}
                        className="w-full bg-gradient-to-r from-primary to-[var(--gradient-blue)] hover:opacity-90"
                        disabled={otpLoading || otpValues.join("").length !== 6}
                    >
                        {otpLoading ? "Verifying..." : "Verify Email"}
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the code?{" "}
                            {resendCooldown > 0 ? (
                                <span className="text-muted-foreground/60">
                                    Resend in {resendCooldown}s
                                </span>
                            ) : (
                                <button
                                    onClick={handleResendOtp}
                                    className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
                                >
                                    Resend OTP
                                </button>
                            )}
                        </p>
                    </div>

                    <FieldDescription className="text-center text-xs">
                        Code expires in 10 minutes
                    </FieldDescription>
                </FieldGroup>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                <FieldGroup>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-[var(--gradient-blue)] to-[var(--gradient-purple)] flex items-center justify-center mb-2">
                            <Brain className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Welcome back</h1>
                        <p className="text-muted-foreground text-balance">
                            Login to your CalmQuest account
                        </p>
                    </div>

                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Field>
                    <Field>
                        <div className="flex items-center">
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Link
                                to="/forgot-password"
                                className="ml-auto text-sm underline-offset-2 hover:underline text-primary"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Field>
                    <Field>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-[var(--gradient-blue)] hover:opacity-90"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </Field>

                    <FieldDescription className="text-center">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
                        >
                            Sign up
                        </button>
                    </FieldDescription>
                </FieldGroup>
            </form>
        </div>
    )
}

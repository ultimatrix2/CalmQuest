import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { signupStart, signupSuccess, signupFailure } from "@/store/authSlice"
import { authService, type SignupData } from "@/services/authService"
import { toast } from "sonner"

interface SignupFormProps extends React.ComponentProps<"form"> {
    onSwitchToLogin?: () => void
}

export function SignupForm({
    className,
    onSwitchToLogin,
    ...props
}: SignupFormProps) {
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [role, setRole] = useState("")
    const [collegeName, setCollegeName] = useState("")
    const [passwordError, setPasswordError] = useState("")

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
        if (passwordError) {
            toast.error(passwordError)
        }
    }, [passwordError])

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError("")

        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters")
            return
        }

        if (!role) {
            setPasswordError("Please select a role")
            return
        }
        if (!collegeName) {
            setPasswordError("Please select a college")
            return
        }

        dispatch(signupStart())

        const signupPayload: SignupData = {
            fullName,
            email,
            password,
            role,
            collegeName,
        }

        try {
            const response = await authService.signup(signupPayload)

            if (response.emailVerificationRequired) {
                // Show OTP input view
                setShowOtpInput(true)
                setResendCooldown(60)
                toast.success("Verification code sent to your email!")
                dispatch(signupFailure("")) // Clear loading state without showing error
            } else {
                dispatch(signupSuccess({
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
            dispatch(signupFailure(err instanceof Error ? err.message : "Signup failed"))
        }
    }

    // OTP input handlers
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
            dispatch(signupSuccess({
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

    // OTP Verification View
    if (showOtpInput) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
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

    // Normal Signup Form
    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    {/* Header handled by parent page */}
                </div>

                <Field>
                    <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
                    <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                    <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel>Role</FieldLabel>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="DOCTOR">Doctor</SelectItem>
                                <SelectItem value="COLLEGE_ADMIN">College Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel>College</FieldLabel>
                        <Select value={collegeName} onValueChange={setCollegeName}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select College" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Motilal Nehru National Institute of Technology Allahabad">MNNIT Allahabad</SelectItem>
                                <SelectItem value="Indian Institute of Technology Delhi">IIT Delhi</SelectItem>
                                <SelectItem value="Indian Institute of Technology Mumbai">IIT Mumbai</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                {/* Extra fields removed for simplified registration */}

                <Field>
                    <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                    <Input
                        id="signup-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <FieldDescription>
                        Must be at least 8 characters long.
                    </FieldDescription>
                </Field>
                <Field>
                    <FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
                    <Input
                        id="signup-confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </Field>
                <Field>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-[var(--gradient-blue)] hover:opacity-90"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                </Field>
                {/* Social Login Removed */}
                <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
                    >
                        Sign in
                    </button>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}

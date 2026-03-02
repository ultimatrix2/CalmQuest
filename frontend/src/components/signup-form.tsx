import { useState } from "react"
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
import { useEffect } from "react"

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
            dispatch(signupSuccess({
                user: {
                    id: response.id,
                    fullName: response.fullName,
                    email: response.email,
                    role: response.role,
                    // Map other fields if returned by backend, but auth success usually returns minimal user info
                },
                token: response.token,
            }))
            navigate("/dashboard")
        } catch (err) {
            dispatch(signupFailure(err instanceof Error ? err.message : "Signup failed"))
        }
    }

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

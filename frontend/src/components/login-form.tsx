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
import { Brain } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { loginStart, loginSuccess, loginFailure } from "@/store/authSlice"
import { authService } from "@/services/authService"
import { toast } from "sonner"
import { useEffect } from "react"

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

    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { loading, error } = useAppSelector((state) => state.auth)

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch(loginStart())

        try {
            const response = await authService.login({ email, password })
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
            dispatch(loginFailure(err instanceof Error ? err.message : "Login failed"))
        }
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
                            <a
                                href="#"
                                className="ml-auto text-sm underline-offset-2 hover:underline text-primary"
                            >
                                Forgot your password?
                            </a>
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

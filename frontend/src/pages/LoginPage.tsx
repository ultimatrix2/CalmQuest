import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain } from "lucide-react"

export default function LoginPage() {
    return (
        <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            {/* Header with logo and theme toggle */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-[var(--gradient-blue)] to-[var(--gradient-purple)] flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold gradient-primary text-gradient">CalmQuest</span>
                </a>
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    )
}

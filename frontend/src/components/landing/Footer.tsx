import { Brain, Github, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-border/50 bg-secondary/20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-[hsl(200,80%,55%)] to-[hsl(270,60%,65%)] flex items-center justify-center">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-primary text-gradient">CalmQuest</span>
                        </div>
                        <p className="text-muted-foreground max-w-sm leading-relaxed">
                            Your personal mental wellness companion. Start your journey to inner peace today.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <a href="#" className="w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <Github className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Download</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Company</h4>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2026 CalmQuest. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-primary transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

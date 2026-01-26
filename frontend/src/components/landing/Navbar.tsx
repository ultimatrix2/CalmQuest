import { Button } from "@/components/ui/button"
import { Brain, Menu } from "lucide-react"
import { useState } from "react"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                            CalmQuest
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                            How It Works
                        </a>
                        <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                            About
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost">Sign In</Button>
                        <Button>Get Started</Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t">
                        <div className="flex flex-col gap-4">
                            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                                How It Works
                            </a>
                            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                                About
                            </a>
                            <div className="flex flex-col gap-2 pt-4 border-t">
                                <Button variant="ghost" className="justify-start">Sign In</Button>
                                <Button className="justify-start">Get Started</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

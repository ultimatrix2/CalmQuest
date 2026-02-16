import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { setTheme } from "@/store/themeSlice"
import type { RootState } from "@/store/store"

export function ThemeToggle() {
    const dispatch = useDispatch()
    const theme = useSelector((state: RootState) => state.theme.theme)

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}
            className="relative"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

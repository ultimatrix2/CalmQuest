import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import AuthPage from "@/pages/AuthPage"

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="calmquest-theme">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/signup" element={<AuthPage />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App

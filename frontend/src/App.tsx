import { Provider } from "react-redux"
import { store } from "@/store/store"
import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import AuthPage from "@/pages/AuthPage"
import DashboardPage from "@/pages/DashboardPage"

function App() {
    return (
        <Provider store={store}>
            <ThemeProvider defaultTheme="light" storageKey="calmquest-theme">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/signup" element={<AuthPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    )
}

export default App

import { Provider } from "react-redux"
import { store } from "@/store/store"
import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import AuthPage from "@/pages/AuthPage"

import { OAuth2RedirectHandler } from "@/components/oauth2-redirect-handler"
import { Toaster } from "@/components/ui/sonner"
import ProtectedRoute from "@/components/ProtectedRoute"
import PublicRoute from "@/components/PublicRoute"
import ProfilePage from "@/pages/dashboard/ProfilePage"
import DashboardLayout from "@/components/DashboardLayout"
import OverviewPage from "@/pages/dashboard/OverviewPage"
import { CommunityPage } from "@/pages/dashboard/CommunityPage"
import { AdminDashboard } from "@/pages/dashboard/AdminDashboard"
import ChatPage from "@/pages/dashboard/ChatPage"
import ReportPage from "@/pages/dashboard/ReportPage"
import AssessmentHistoryPage from "@/pages/dashboard/AssessmentHistoryPage"

function App() {
    return (
        <Provider store={store}>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

                        {/* Public Routes - accessible only when NOT logged in */}
                        <Route element={<PublicRoute />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<AuthPage />} />
                            <Route path="/signup" element={<AuthPage />} />
                        </Route>

                        {/* Protected Routes - accessible only when logged in */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<DashboardLayout />}>
                                <Route index element={<OverviewPage />} />
                                <Route path="profile" element={<ProfilePage />} />
                                <Route path="community" element={<CommunityPage />} />
                                <Route path="admin" element={<AdminDashboard />} />
                                <Route path="chat" element={<ChatPage />} />
                                <Route path="report" element={<ReportPage />} />
                                <Route path="report/:reportId" element={<ReportPage />} />
                                <Route path="assessment-history" element={<AssessmentHistoryPage />} />
                            </Route>
                        </Route>
                    </Routes>
                    <Toaster position="top-right" richColors />
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    )
}

export default App

import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"

const PublicRoute = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export default PublicRoute

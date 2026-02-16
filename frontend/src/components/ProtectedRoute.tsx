import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"
import { toast } from "sonner"
import { useEffect } from "react"

const ProtectedRoute = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("You need to login first!")
        }
    }, [isAuthenticated])

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute

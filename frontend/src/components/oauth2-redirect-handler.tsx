import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAppDispatch } from "@/store/hooks"
import { loginSuccess, loginFailure } from "@/store/authSlice"

export function OAuth2RedirectHandler() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    useEffect(() => {
        const token = searchParams.get("token")
        if (token) {
            // We need to decode the token to get user info, but for now let's just save the token
            // and maybe fetch user info from an endpoint.
            // Or simpler: The backend could pass user info in query params too, or we just rely on token.
            // A better way is to use the token to fetch "me" from backend.

            // For this quick implementation, let's assume we need to fetch user details.
            // But authSlice expects a user object.
            // Let's manually construct a temporary user or fetch it.
            // Ideally backend sends user details or we fetch /api/auth/me

            // Let's decode token payload if possible, or just fetch /api/users/me
            // Since we don't have /api/users/me yet, let's try to extract from token if it's a JWT.

            try {
                // simple parse of JWT payload
                const base64Url = token.split('.')[1]
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                }).join(''))

                const payload = JSON.parse(jsonPayload)

                dispatch(loginSuccess({
                    user: {
                        id: 0, // We might not have ID here unless we put it in token
                        fullName: payload.sub, // using email as name fallback or if token has name
                        email: payload.sub,
                        role: "USER" // Default
                    },
                    token: token
                }))

                // Persist to local storage is handled by authSlice or authService? 
                // authSlice updates state. authService handles API.
                // We should also save to localStorage manually here similar to authService
                localStorage.setItem("token", token)
                localStorage.setItem("user", JSON.stringify({ email: payload.sub, role: "USER" }))

                navigate("/dashboard")
            } catch (e) {
                console.error("Failed to process token", e)
                dispatch(loginFailure("Failed to process login"))
                navigate("/login")
            }
        } else {
            dispatch(loginFailure("No token received"))
            navigate("/login")
        }
    }, [searchParams, navigate, dispatch])

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )
}

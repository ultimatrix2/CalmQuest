import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface User {
    id: number
    fullName: string
    email: string
    role: string
    profilePicture?: string
    collegeName?: string
    collegeId?: number
    specialization?: string
    licenseNumber?: string
    communityStatus?: string
    registrationNumber?: string
    course?: string
    studentYear?: string
    collegeIdNumber?: string
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    token: string | null
    loading: boolean
    error: string | null
}

// Check localStorage for existing session
const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null

const initialState: AuthState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: !!storedToken,
    token: storedToken,
    loading: false,
    error: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true
            state.error = null
        },
        loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.loading = false
            state.isAuthenticated = true
            state.user = action.payload.user
            state.token = action.payload.token
            state.error = null
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
        },
        signupStart: (state) => {
            state.loading = true
            state.error = null
        },
        signupSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.loading = false
            state.isAuthenticated = true
            state.user = action.payload.user
            state.token = action.payload.token
            state.error = null
        },
        signupFailure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
        },
        logout: (state) => {
            state.user = null
            state.isAuthenticated = false
            state.token = null
            state.loading = false
            state.error = null
            // Clear localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }
        },
        clearError: (state) => {
            state.error = null
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload }
                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(state.user))
                }
            }
        },
    },
})

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    signupStart,
    signupSuccess,
    signupFailure,
    logout,
    clearError,
    updateUser
} = authSlice.actions
export default authSlice.reducer

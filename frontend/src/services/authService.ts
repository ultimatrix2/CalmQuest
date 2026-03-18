const API_BASE_URL = 'http://localhost:8080/api';

export interface SignupData {
    fullName: string;
    email: string;
    password: string;
    role: string;
    collegeName: string;
    registrationNumber?: string;
    course?: string;
    studentYear?: string;
    specialization?: string;
    licenseNumber?: string;
    collegeIdNumber?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    id: number;
    fullName: string;
    email: string;
    role: string;
    emailVerificationRequired?: boolean;
}

export interface User {
    id: number;
    fullName: string;
    email: string;
    role: string;
}

export interface DailyRecommendation {
    id: number;
    recommendations: string;
    category: string;
    severityScore: number;
    generatedAt: string;
    isRead: boolean;
}

class AuthService {
    private getToken(): string | null {
        return localStorage.getItem('token');
    }

    async signup(data: SignupData): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.errors?.email || 'Signup failed');
        }

        const authResponse: AuthResponse = await response.json();
        
        // Don't save session if email verification is required
        if (!authResponse.emailVerificationRequired) {
            this.setSession(authResponse);
        }
        
        return authResponse;
    }

    async login(data: LoginData): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid email or password');
        }

        const authResponse: AuthResponse = await response.json();
        
        // Don't save session if email verification is required
        if (!authResponse.emailVerificationRequired) {
            this.setSession(authResponse);
        }
        
        return authResponse;
    }

    async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'OTP verification failed');
        }

        const authResponse: AuthResponse = await response.json();
        this.setSession(authResponse);
        return authResponse;
    }

    async resendOtp(email: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to resend OTP');
        }
    }

    async getTodayRecommendation(): Promise<DailyRecommendation | null> {
        const response = await fetch(`${API_BASE_URL}/recommendations/today`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (data.message) return null; // No recommendation available
        return data;
    }

    async getRecommendationHistory(): Promise<DailyRecommendation[]> {
        const response = await fetch(`${API_BASE_URL}/recommendations/history`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) return [];
        return response.json();
    }

    async generateRecommendation(): Promise<DailyRecommendation | null> {
        const response = await fetch(`${API_BASE_URL}/recommendations/generate`, {
            method: 'POST',
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) return null;
        return response.json();
    }

    async forgotPassword(email: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to request password reset');
        }
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reset password');
        }
    }

    private setSession(authResponse: AuthResponse): void {
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('user', JSON.stringify({
            id: authResponse.id,
            fullName: authResponse.fullName,
            email: authResponse.email,
            role: authResponse.role,
        }));
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getAuthHeader(): { Authorization: string } | {} {
        const token = this.getToken();
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    }
}

export const authService = new AuthService();

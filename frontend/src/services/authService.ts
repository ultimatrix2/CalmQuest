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
}

export interface User {
    id: number;
    fullName: string;
    email: string;
    role: string;
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
        this.setSession(authResponse);
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
        this.setSession(authResponse);
        return authResponse;
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

import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface User {
    id: number;
    fullName: string;
    email: string;
    profilePicture: string;
    role: string;
    communityStatus: string;
    college?: {
        id: number;
        name: string;
    }
    specialization?: string;
    licenseNumber?: string;
    course?: string;
    studentYear?: string;
    registrationNumber?: string;
}

export const adminService = {
    // Super Admin methods
    getPendingAdmins: async () => {
        const response = await axios.get(`${API_URL}/super-admin/pending-admins`, getAuthHeader());
        return response.data as User[];
    },
    verifyAdmin: async (adminId: number, isApproved: boolean, reason?: string) => {
        const url = `${API_URL}/super-admin/verify-admin/${adminId}?isApproved=${isApproved}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`;
        const response = await axios.put(url, {}, getAuthHeader());
        return response.data as User;
    },

    // College Admin methods
    getPendingUsers: async () => {
        const response = await axios.get(`${API_URL}/college-admin/pending-students`, getAuthHeader());
        return response.data as User[];
    },
    verifyUser: async (userId: number, isApproved: boolean, reason?: string) => {
        const url = `${API_URL}/college-admin/verify-student/${userId}?isApproved=${isApproved}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`;
        const response = await axios.put(url, {}, getAuthHeader());
        return response.data as User;
    }
};

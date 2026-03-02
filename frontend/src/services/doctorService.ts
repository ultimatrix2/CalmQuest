import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface Doctor {
    id: number;
    fullName: string;
    email: string;
    profilePicture: string;
    specialization: string;
    licenseNumber: string;
    college: {
        id: number;
        name: string;
    };
}

export const doctorService = {
    getDoctorsInCollege: async (): Promise<Doctor[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/doctors/college`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

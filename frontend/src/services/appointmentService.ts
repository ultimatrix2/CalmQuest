import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface Appointment {
    id: number;
    studentId: number;
    studentName: string;
    studentEmail: string;
    studentProfilePicture?: string;
    doctorId: number;
    doctorName: string;
    doctorProfilePicture?: string;
    appointmentTime: string | null;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    reason: string;
    meetingLink?: string;
}

export const appointmentService = {
    requestAppointment: async (doctorId: number, reason: string): Promise<Appointment> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/appointments`, { doctorId, reason }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getStudentAppointments: async (): Promise<Appointment[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/appointments/student`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getDoctorAppointments: async (): Promise<Appointment[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/appointments/doctor`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updateStatus: async (id: number, status: string, appointmentTime?: string, meetingLink?: string): Promise<Appointment> => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/api/appointments/${id}/status`, { status, appointmentTime, meetingLink }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

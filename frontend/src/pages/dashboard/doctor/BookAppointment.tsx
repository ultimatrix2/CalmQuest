import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarPlus, User } from 'lucide-react';
import { toast } from 'sonner';
import { doctorService, type Doctor } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';

export default function BookAppointment() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            const data = await doctorService.getDoctorsInCollege();
            setDoctors(data);
        } catch (error) {
            toast.error('Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedDoctor) {
            toast.error('Please select a doctor');
            return;
        }
        if (!reason.trim()) {
            toast.error('Please provide a reason for the appointment');
            return;
        }

        setSubmitting(true);
        try {
            await appointmentService.requestAppointment(selectedDoctor, reason);
            toast.success('Appointment requested successfully!');
            setSelectedDoctor(null);
            setReason('');
        } catch (error) {
            toast.error('Failed to request appointment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
                <p className="text-muted-foreground mt-2">
                    Request a mental health assessment appointment with your college specialist.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Available Doctors</h2>
                    {doctors.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No verified doctors available in your college yet.
                            </CardContent>
                        </Card>
                    ) : (
                        doctors.map(doctor => (
                            <Card
                                key={doctor.id}
                                className={`cursor-pointer transition-colors ${selectedDoctor === doctor.id ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                onClick={() => setSelectedDoctor(doctor.id)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {doctor.profilePicture ? (
                                            <img src={doctor.profilePicture} alt={doctor.fullName} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{doctor.fullName}</h3>
                                        <p className="text-sm text-muted-foreground">{doctor.specialization || 'Mental Health Specialist'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Appointment Details</h2>
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reason for Appointment</label>
                                <Textarea
                                    placeholder="Briefly describe what you'd like to discuss..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={handleBook}
                                disabled={!selectedDoctor || !reason.trim() || submitting}
                            >
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                                Request Appointment
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Video } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentService, type Appointment } from '@/services/appointmentService';

export default function MyAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getStudentAppointments();
            setAppointments(data);
        } catch (error) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="container max-w-4xl py-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
                    <p className="text-muted-foreground mt-2">
                        You have no appointment history.
                    </p>
                </div>
                <Card>
                    <CardContent className="py-8 text-center">
                        <Button asChild>
                            <a href="/dashboard/doctor/book">Book a new appointment</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>

            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {appointments.map(apt => (
                    <Card key={apt.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden">
                                    {apt.doctorProfilePicture && <img src={apt.doctorProfilePicture} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <div>
                                    <CardTitle className="text-base text-primary">Dr. {apt.doctorName}</CardTitle>
                                </div>
                            </div>
                            <Badge variant={apt.status === 'PENDING' ? 'outline' : apt.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                                {apt.status}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="bg-muted p-3 rounded-md text-sm">
                                <span className="font-semibold block mb-1">Reason:</span>
                                {apt.reason}
                            </div>

                            {apt.status === 'CONFIRMED' && apt.appointmentTime && (
                                <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 p-2 rounded-md">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(apt.appointmentTime).toLocaleString()}
                                </div>
                            )}

                            {apt.status === 'CONFIRMED' && apt.meetingLink && (
                                <div className="pt-2">
                                    <Button className="w-full" asChild>
                                        <a href={apt.meetingLink} target="_blank" rel="noreferrer">
                                            <Video className="mr-2 h-4 w-4" /> Join Meeting
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

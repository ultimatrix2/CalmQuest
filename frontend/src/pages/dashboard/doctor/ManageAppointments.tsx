import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Video, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentService, type Appointment } from '@/services/appointmentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state for confirming appointment
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, appointmentId: number | null }>({ isOpen: false, appointmentId: null });
    const [scheduledDate, setScheduledDate] = useState<Date>();
    const [scheduledTime, setScheduledTime] = useState('');
    const [meetingLink] = useState('');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getDoctorAppointments();
            setAppointments(data);
        } catch (error) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!scheduledDate || !scheduledTime) {
            toast.error('Please select both a date and a time');
            return;
        }

        const dateStr = format(scheduledDate, 'yyyy-MM-dd');
        const dateTimeStr = `${dateStr}T${scheduledTime}:00`;
        const localDate = new Date(dateTimeStr);
        if (isNaN(localDate.getTime())) {
            toast.error('Invalid date or time');
            return;
        }

        // Auto-generate a meeting link if one isn't provided (for the custom room later)
        const link = meetingLink || `/dashboard/meeting/${confirmDialog.appointmentId}`;

        try {
            await appointmentService.updateStatus(confirmDialog.appointmentId!, 'CONFIRMED', localDate.toISOString(), link);
            toast.success('Appointment confirmed and scheduled');
            setConfirmDialog({ isOpen: false, appointmentId: null });
            loadAppointments();
        } catch (error) {
            toast.error('Failed to confirm appointment');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await appointmentService.updateStatus(id, 'CANCELLED');
            toast.success('Appointment cancelled');
            loadAppointments();
        } catch (error) {
            toast.error('Failed to cancel appointment');
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await appointmentService.updateStatus(id, 'COMPLETED');
            toast.success('Appointment marked as completed');
            loadAppointments();
        } catch (error) {
            toast.error('Failed to complete appointment');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingRequests = appointments.filter(a => a.status === 'PENDING');
    const scheduledAppointments = appointments.filter(a => a.status === 'CONFIRMED');
    const pastAppointments = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED');

    const renderAppointmentCard = (apt: Appointment) => (
        <Card key={apt.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden">
                        {apt.studentProfilePicture && <img src={apt.studentProfilePicture} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                        <CardTitle className="text-base">{apt.studentName}</CardTitle>
                        <CardDescription>{apt.studentEmail}</CardDescription>
                    </div>
                </div>
                <Badge variant={apt.status === 'PENDING' ? 'outline' : apt.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {apt.status}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-md text-sm">
                    <span className="font-semibold block mb-1">Reason:</span>
                    {apt.reason}
                </div>

                {apt.status === 'CONFIRMED' && apt.appointmentTime && (
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Calendar className="h-4 w-4" />
                        {new Date(apt.appointmentTime).toLocaleString()}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                    {apt.status === 'PENDING' && (
                        <>
                            <Button size="sm" onClick={() => setConfirmDialog({ isOpen: true, appointmentId: apt.id })}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Schedule
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(apt.id)}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </>
                    )}

                    {apt.status === 'CONFIRMED' && (
                        <>
                            <Button size="sm" asChild>
                                <a href={apt.meetingLink} target="_blank" rel="noreferrer">
                                    <Video className="mr-2 h-4 w-4" /> Join Meeting
                                </a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleComplete(apt.id)}>
                                Mark Completed
                            </Button>
                        </>
                    )}

                    {/* View Report button - links to student's report history using existing AI diagnosis feature */}
                    <Button size="sm" variant="outline" asChild>
                        <a href={`/dashboard/report?studentId=${apt.studentId}`} target="_blank" rel="noreferrer">
                            View Health Reports
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="container max-w-5xl py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Appointment Management</h1>
                <p className="text-muted-foreground mt-2">
                    Review incoming requests and manage your scheduled meetings with students.
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground">No pending requests.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {pendingRequests.map(renderAppointmentCard)}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Scheduled Meetings ({scheduledAppointments.length})</h2>
                    {scheduledAppointments.length === 0 ? (
                        <p className="text-muted-foreground">No upcoming scheduled meetings.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {scheduledAppointments.map(renderAppointmentCard)}
                        </div>
                    )}
                </div>

                {pastAppointments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
                        <div className="grid md:grid-cols-2 gap-4 opacity-75">
                            {pastAppointments.map(renderAppointmentCard)}
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog for Scheduling */}
            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, appointmentId: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Appointment</DialogTitle>
                        <DialogDescription>
                            Set a time for this appointment. A meeting link will be automatically generated.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2 flex flex-col">
                            <label className="text-sm font-medium">Scheduled Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-between text-left font-normal ${!scheduledDate ? 'text-muted-foreground' : ''}`}
                                    >
                                        {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                                        <Calendar className="mr-2 h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={scheduledDate}
                                        onSelect={setScheduledDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Scheduled Time</label>
                            <Input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, appointmentId: null })}>Cancel</Button>
                        <Button onClick={handleConfirm}>Confirm & Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut } from 'lucide-react';

export default function MeetingRoom() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    if (!user || !appointmentId) return null;

    return (
        <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
            {/* Header bar */}
            <div className="h-14 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
                        <LogOut className="h-4 w-4" />
                    </div>
                    <h1 className="font-semibold text-sm">Consultation Room <span className="text-muted-foreground font-normal ml-2">#{appointmentId}</span></h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Exit to Dashboard
                    </Button>
                </div>
            </div>

            {/* Full screen Video & Chat (Jitsi) */}
            <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-900">
                <JitsiMeeting
                    domain="meet.ffmuc.net"
                    roomName={`CalmQuest-Appointment-${appointmentId}`}
                    getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
                    configOverwrite={{
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        disableModeratorIndicator: true,
                        enableEmailInStats: false,
                        prejoinPageEnabled: false,
                        requireDisplayName: false
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        SHOW_CHROME_EXTENSION_BANNER: false
                    }}
                    userInfo={{
                        displayName: user.fullName || "Guest User",
                        email: user.email || "guest@example.com"
                    }}
                    onApiReady={(externalApi) => {
                        externalApi.addListener('videoConferenceLeft', () => {
                            navigate('/dashboard');
                        });
                    }}
                />
            </div>
        </div>
    );
}

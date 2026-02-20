import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { adminService, type User as AdminUser } from '@/services/adminService';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ user: AdminUser, action: 'approve' | 'reject' } | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const navigate = useNavigate();

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isCollegeAdmin = user?.role === 'COLLEGE_ADMIN';

    useEffect(() => {
        if (!isSuperAdmin && !isCollegeAdmin) return;

        const fetchPendingUsers = async () => {
            try {
                setLoading(true);
                if (isSuperAdmin) {
                    const admins = await adminService.getPendingAdmins();
                    setPendingUsers(admins);
                } else if (isCollegeAdmin) {
                    const users = await adminService.getPendingUsers();
                    setPendingUsers(users);
                }
            } catch (error) {
                toast.error("Failed to load pending users");
            } finally {
                setLoading(false);
            }
        };

        fetchPendingUsers();
    }, [isSuperAdmin, isCollegeAdmin]);

    const handleConfirmAction = async () => {
        if (!selectedUser) return;

        const { user: targetUser, action } = selectedUser;
        const isApproved = action === 'approve';

        try {
            if (isSuperAdmin) {
                await adminService.verifyAdmin(targetUser.id, isApproved, action === 'reject' ? rejectionReason : undefined);
                toast.success(`Admin ${targetUser.fullName} has been ${isApproved ? 'approved' : 'rejected'}`);
            } else if (isCollegeAdmin) {
                await adminService.verifyUser(targetUser.id, isApproved, action === 'reject' ? rejectionReason : undefined);
                toast.success(`${targetUser.role.charAt(0) + targetUser.role.slice(1).toLowerCase()} ${targetUser.fullName} has been ${isApproved ? 'approved' : 'rejected'}`);
            }

            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== targetUser.id));

        } catch (error) {
            toast.error("Failed to update user status");
        } finally {
            setSelectedUser(null);
            setRejectionReason("");
        }
    };

    if (!isSuperAdmin && !isCollegeAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                    You do not have administrative privileges to view this page.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isSuperAdmin ? 'Super Admin Dashboard' : 'College Admin Dashboard'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isSuperAdmin
                            ? 'Manage and approve new College Administrators.'
                            : 'Review and verify pending student and doctor registrations for your college community.'}
                    </p>
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Pending Verifications</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-80" />
                        <h3 className="text-lg font-medium">All caught up!</h3>
                        <p className="text-muted-foreground mt-1">There are no pending verification requests at this time.</p>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {pendingUsers.map(pendingUser => (
                            <li key={pendingUser.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                                        {pendingUser.profilePicture ? (
                                            <img src={pendingUser.profilePicture} alt={pendingUser.fullName} className="h-full w-full object-cover" />
                                        ) : (
                                            pendingUser.fullName.charAt(0).toUpperCase() // Fallback
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg">{pendingUser.fullName}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{pendingUser.email}</span>
                                            <span>•</span>
                                            <span className="capitalize">{pendingUser.role.replace('_', ' ').toLowerCase()}</span>
                                            {isSuperAdmin && pendingUser.college && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium text-primary/80">{pendingUser.college.name}</span>
                                                </>
                                            )}
                                        </div>
                                        {pendingUser.role === 'DOCTOR' && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span>Spec: {pendingUser.specialization || 'N/A'}</span>
                                                <span>•</span>
                                                <span>License: {pendingUser.licenseNumber || 'N/A'}</span>
                                            </div>
                                        )}
                                        {pendingUser.role === 'STUDENT' && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span>Course: {pendingUser.course || 'N/A'} ({pendingUser.studentYear || '1'})</span>
                                                <span>•</span>
                                                <span>Reg: {pendingUser.registrationNumber || 'N/A'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Button
                                        variant="ghost"
                                        className="w-full sm:w-auto"
                                        onClick={() => navigate('/dashboard/profile?userId=' + pendingUser.id)}
                                    >
                                        View Profile
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                                        onClick={() => setSelectedUser({ user: pendingUser, action: 'reject' })}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => setSelectedUser({ user: pendingUser, action: 'approve' })}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Approval Confirmation */}
            <AlertDialog
                open={selectedUser?.action === 'approve'}
                onOpenChange={(open) => {
                    if (!open) setSelectedUser(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to approve <span className="font-semibold text-foreground">{selectedUser?.user.fullName}</span>?
                            This user will gain full access to the platform.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmAction();
                            }}
                        >
                            Confirm Approval
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rejection Dialog */}
            <Dialog
                open={selectedUser?.action === 'reject'}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedUser(null);
                        setRejectionReason("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Rejection</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting <span className="font-semibold text-foreground">{selectedUser?.user.fullName}</span>. This will be sent as a notification.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason">Rejection Reason (Optional)</Label>
                        <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g. Please provide a valid registration number."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmAction}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { adminService, type User as AdminUser, type PostReport } from '@/services/adminService';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Users, AlertTriangle, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    console.log("[AdminDashboard] Component rendered");
    const { user } = useAuth();
    console.log("[AdminDashboard] User from useAuth:", user);

    const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ user: AdminUser, action: 'approve' | 'reject' } | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [reportedPosts, setReportedPosts] = useState<PostReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    
    // Emergency Contacts State
    const [emergencyPhone, setEmergencyPhone] = useState("");
    const [emergencyEmail, setEmergencyEmail] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [savingContacts, setSavingContacts] = useState(false);

    const navigate = useNavigate();

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isCollegeAdmin = user?.role === 'COLLEGE_ADMIN';
    console.log("[AdminDashboard] Roles - isSuperAdmin:", isSuperAdmin, "isCollegeAdmin:", isCollegeAdmin);

    useEffect(() => {
        console.log("[AdminDashboard] useEffect triggered");
        if (!isSuperAdmin && !isCollegeAdmin) {
            console.log("[AdminDashboard] User is not an admin, exiting useEffect");
            return;
        }

        const fetchPendingUsers = async () => {
            console.log("[AdminDashboard] fetchPendingUsers started");
            try {
                setLoading(true);
                if (isSuperAdmin) {
                    console.log("[AdminDashboard] Fetching pending admins...");
                    const admins = await adminService.getPendingAdmins();
                    console.log("[AdminDashboard] Admins fetched:", admins);
                    setPendingUsers(Array.isArray(admins) ? admins : []);
                } else if (isCollegeAdmin) {
                    console.log("[AdminDashboard] Fetching pending students...");
                    const users = await adminService.getPendingUsers();
                    console.log("[AdminDashboard] Students fetched:", users);
                    setPendingUsers(Array.isArray(users) ? users : []);
                }
            } catch (error) {
                console.error("[AdminDashboard] Error fetching users:", error);
                toast.error("Failed to load pending users");
            } finally {
                setLoading(false);
            }
        };

        const fetchReports = async () => {
            if (isCollegeAdmin) {
                console.log("[AdminDashboard] fetchReports started");
                try {
                    setLoadingReports(true);
                    const reports = await adminService.getReportedPosts();
                    console.log("[AdminDashboard] Reports fetched:", reports);
                    setReportedPosts(Array.isArray(reports) ? reports : []);
                } catch (error) {
                    console.error("[AdminDashboard] Error fetching reports:", error);
                    toast.error("Failed to load reported posts");
                } finally {
                    setLoadingReports(false);
                }
            }
        };

        const fetchContacts = async () => {
            if (isCollegeAdmin) {
                try {
                    setLoadingContacts(true);
                    const contacts = await adminService.getEmergencyContacts();
                    setEmergencyPhone(contacts.emergencyPhone || "");
                    setEmergencyEmail(contacts.emergencyEmail || "");
                } catch (error) {
                    toast.error("Failed to load emergency contacts");
                } finally {
                    setLoadingContacts(false);
                }
            }
        };

        fetchPendingUsers();
        fetchReports();
        fetchContacts();
    }, [isSuperAdmin, isCollegeAdmin]);

    const handleSaveContacts = async () => {
        try {
            setSavingContacts(true);
            await adminService.updateEmergencyContacts(emergencyPhone, emergencyEmail);
            toast.success("Emergency contacts updated successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update emergency contacts");
        } finally {
            setSavingContacts(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!selectedUser) return;

        const { user: targetUser, action } = selectedUser;
        const isApproved = action === 'approve';

        // Close dialogs immediately to prevent stale state issues
        setSelectedUser(null);

        try {
            if (isSuperAdmin) {
                await adminService.verifyAdmin(targetUser.id, isApproved, action === 'reject' ? rejectionReason : undefined);
                toast.success(`Admin ${targetUser.fullName} has been ${isApproved ? 'approved' : 'rejected'}`);
            } else if (isCollegeAdmin) {
                await adminService.verifyUser(targetUser.id, isApproved, action === 'reject' ? rejectionReason : undefined);
                const roleLabel = targetUser.role
                    ? targetUser.role.charAt(0) + targetUser.role.slice(1).toLowerCase()
                    : 'User';
                toast.success(`${roleLabel} ${targetUser.fullName} has been ${isApproved ? 'approved' : 'rejected'}`);
            }

            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== targetUser.id));

        } catch (error) {
            toast.error("Failed to update user status");
        } finally {
            setRejectionReason("");
        }
    };

    const handleDismissReport = async (reportId: number) => {
        try {
            await adminService.dismissReport(reportId);
            setReportedPosts(prev => prev.filter(r => r.id !== reportId));
            toast.success("Report dismissed successfully");
        } catch (error) {
            toast.error("Failed to dismiss report");
        }
    };

    const handleDeleteReportedPost = async (postId: number) => {
        try {
            await adminService.deleteReportedPost(postId);
            // FIX: use optional chaining to safely access post.id in filter
            setReportedPosts(prev => prev.filter(r => r.post?.id !== postId));
            toast.success("Post deleted successfully");
        } catch (error) {
            toast.error("Failed to delete post");
        }
    };

    if (!isSuperAdmin && !isCollegeAdmin) {
        console.log("[AdminDashboard] Returning Access Denied screen");
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

    // FIX: Derive dialog open state from stable booleans to avoid undefined comparisons
    const isApproveDialogOpen = selectedUser !== null && selectedUser.action === 'approve';
    const isRejectDialogOpen = selectedUser !== null && selectedUser.action === 'reject';

    console.log("[AdminDashboard] Returning Main Dashboard screen");
    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isSuperAdmin ? 'Super Admin Dashboard' : 'College Admin Dashboard'}
                    </h1>
                    {/* <p className="text-muted-foreground">
                        {isSuperAdmin
                            ? 'Manage and approve new College Administrators.'
                            : 'Review and verify pending student and doctor registrations for your college community.'}
                    </p> */}
                </div>
            </div>

            <Tabs defaultValue="verifications" className="w-full">
                <TabsList className="mb-4 flex-wrap pb-2 sm:pb-0 h-auto sm:h-10">
                    <TabsTrigger value="verifications">Pending Verifications</TabsTrigger>
                    {isCollegeAdmin && <TabsTrigger value="reports">Reported Posts</TabsTrigger>}
                    {isCollegeAdmin && <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>}
                </TabsList>

                <TabsContent value="verifications">
                    <div className="bg-card rounded-xl border shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold">Pending Verifications</h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : !Array.isArray(pendingUsers) || pendingUsers.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-80" />
                                <h3 className="text-lg font-medium">All caught up!</h3>
                                <p className="text-muted-foreground mt-1">There are no pending verification requests at this time.</p>
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {Array.isArray(pendingUsers) && pendingUsers.map(pendingUser => (
                                    <li key={pendingUser.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                                                {pendingUser.profilePicture ? (
                                                    <img src={pendingUser.profilePicture} alt={pendingUser.fullName} className="h-full w-full object-cover" />
                                                ) : (
                                                    pendingUser.fullName?.charAt(0)?.toUpperCase() || '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-lg">{pendingUser.fullName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{pendingUser.email}</span>
                                                    <span>•</span>
                                                    {/* FIX: safely handle undefined role */}
                                                    <span className="capitalize">{pendingUser.role?.replace(/_/g, ' ')?.toLowerCase() ?? 'User'}</span>
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
                </TabsContent>

                {isCollegeAdmin && (
                    <TabsContent value="reports">
                        <div className="bg-card rounded-xl border shadow-sm">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold">Reported Posts</h2>
                            </div>

                            {loadingReports ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !Array.isArray(reportedPosts) || reportedPosts.length === 0 ? (
                                <div className="text-center py-20 px-4">
                                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-80" />
                                    <h3 className="text-lg font-medium">All clear!</h3>
                                    <p className="text-muted-foreground mt-1">No community posts have been reported.</p>
                                </div>
                            ) : (
                                <ul className="divide-y">
                                    {Array.isArray(reportedPosts) && reportedPosts.map(report => (
                                        <li key={report.id} className="p-6 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                                    <span className="font-semibold text-lg">Reason: {report.reason?.replace(/_/g, ' ') || 'Unknown'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleDismissReport(report.id)}>
                                                        Dismiss Report
                                                    </Button>
                                                    {/* FIX: guard against undefined post.id */}
                                                    {report.post?.id != null && (
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteReportedPost(report.post.id)}>
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Post
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-muted/50 p-4 rounded-md space-y-2">
                                                <div className="text-sm font-medium text-muted-foreground">Reported by {report.reporter?.fullName || 'Anonymous'}</div>
                                                {report.description && (
                                                    <div className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3">"{report.description}"</div>
                                                )}
                                            </div>
                                            <div className="border rounded-md p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {/* FIX: safe chaining on nested post.author */}
                                                    <span className="font-semibold text-sm">Post by {report.post?.author?.fullName || report.post?.authorName || 'Unknown User'}</span>
                                                </div>
                                                <p className="text-sm line-clamp-3">{report.post?.content || 'Content unavailable'}</p>
                                                <Button variant="link" size="sm" className="px-0 mt-2 h-auto" onClick={() => navigate('/dashboard/community')}>
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Go to Community
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </TabsContent>
                )}

                {isCollegeAdmin && (
                    <TabsContent value="emergency">
                        <div className="bg-card rounded-xl border shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-2">Emergency Contacts</h2>
                            <p className="text-muted-foreground mb-6">Set the official emergency contact information for your college. This will be used in the SOS feature alerts.</p>
                            
                            {loadingContacts ? (
                                <div className="flex justify-center items-center py-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-5 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyPhone">Emergency Phone Number</Label>
                                        <div className="relative">
                                            <AlertTriangle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <input 
                                                id="emergencyPhone"
                                                type="tel" 
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                                                placeholder="+1 (555) 123-4567"
                                                value={emergencyPhone}
                                                onChange={(e) => setEmergencyPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyEmail">Emergency Email Address</Label>
                                        <div className="relative">
                                            <AlertTriangle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <input 
                                                id="emergencyEmail"
                                                type="email" 
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                                                placeholder="emergency@college.edu"
                                                value={emergencyEmail}
                                                onChange={(e) => setEmergencyEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        onClick={handleSaveContacts} 
                                        disabled={savingContacts}
                                        className="w-full mt-2"
                                    >
                                        {savingContacts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Save Emergency Contacts
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            {/* Approval Confirmation */}
            <AlertDialog
                open={isApproveDialogOpen}
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
                open={isRejectDialogOpen}
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
                        <Button variant="outline" onClick={() => { setSelectedUser(null); setRejectionReason(""); }}>Cancel</Button>
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
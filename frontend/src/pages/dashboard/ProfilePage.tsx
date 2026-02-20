import { useOutletContext, useSearchParams } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { updateUser } from "@/store/authSlice"
import { Camera } from "lucide-react"
import { adminService } from "@/services/adminService"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Mock API call - replace with real API service later
const updateProfileApi = async (formData: FormData, token: string) => {
    const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
            // Content-Type is unused here so browser can set boundary
        },
        body: formData
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
}

const fetchProfileApi = async (token: string, userId?: string) => {
    const url = userId ? `http://localhost:8080/api/users/${userId}` : 'http://localhost:8080/api/users/me';
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
}

export default function ProfilePage() {
    const { isEditMode, setIsEditMode } = useOutletContext<{ isEditMode: boolean, setIsEditMode: (v: boolean) => void }>()
    const { user, token } = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch()
    const [searchParams] = useSearchParams()
    const targetUserId = searchParams.get('userId')
    const isAdminView = !!targetUserId && (user?.role === 'COLLEGE_ADMIN' || user?.role === 'SUPER_ADMIN')
    const [loading, setLoading] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        role: user?.role || '',
        collegeName: user?.collegeName || '',
        collegeId: user?.collegeId,
        specialization: user?.specialization || '',
        licenseNumber: user?.licenseNumber || '',
        registrationNumber: user?.registrationNumber || '',
        course: user?.course || '',
        studentYear: user?.studentYear || '',
        collegeIdNumber: user?.collegeIdNumber || '',
        profilePicture: user?.profilePicture || '',
        communityStatus: user?.communityStatus || 'NONE'
    })

    // Fetch full profile on mount to get latest data
    useEffect(() => {
        if (token) {
            const idToFetch = targetUserId || undefined
            fetchProfileApi(token, idToFetch)
                .then(data => {
                    setFormData(prev => ({ ...prev, ...data }))
                    // Update Redux state as well to keep it in sync
                    if (!targetUserId) {
                        dispatch(updateUser(data))
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch profile", err)
                    toast.error("Failed to load profile")
                })
        }
    }, [token, dispatch, targetUserId])

    // Disable edit mode if looking at another user
    useEffect(() => {
        if (isAdminView) {
            setIsEditMode(false)
        }
    }, [isAdminView, setIsEditMode])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size to large. Please select an image under 5MB.")
                return;
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerFileInput = () => {
        if (isEditMode && fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleSave = async () => {
        if (!token) return;
        setLoading(true)
        try {
            const formDataToSend = new FormData();

            // 1. Prepare JSON Data
            const profileData = {
                fullName: formData.fullName,
                role: formData.role,
                // Don't send profilePicture in JSON anymore, relying on URL from backend response or File upload
                specialization: formData.role === 'DOCTOR' ? formData.specialization : null,
                licenseNumber: formData.role === 'DOCTOR' ? formData.licenseNumber : null,
                registrationNumber: formData.role === 'STUDENT' ? formData.registrationNumber : null,
                course: formData.role === 'STUDENT' ? formData.course : null,
                studentYear: formData.role === 'STUDENT' ? formData.studentYear : null,
                collegeIdNumber: formData.role === 'COLLEGE_ADMIN' ? formData.collegeIdNumber : null,
            };

            // 2. Append JSON as 'data' Blob
            formDataToSend.append('data', new Blob([JSON.stringify(profileData)], {
                type: 'application/json'
            }));

            // 3. Append File if selected (from file input, checking if it's a File object not just a view string)
            if (fileInputRef.current?.files?.[0]) {
                formDataToSend.append('file', fileInputRef.current.files[0]);
            }

            const updatedUser = await updateProfileApi(formDataToSend, token)

            // Update local form state
            setFormData(prev => ({ ...prev, ...updatedUser }))
            dispatch(updateUser(updatedUser))
            toast.success("Profile updated successfully")
            setIsEditMode(false)
        } catch (error) {
            toast.error("Failed to update profile")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleRequestVerification = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/users/verification/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Verification request sent successfully");
                // Refresh profile
                const updatedProfile = await fetchProfileApi(token);
                setFormData(prev => ({ ...prev, ...updatedProfile }));
                dispatch(updateUser(updatedProfile));
            } else {
                const msg = await response.text();
                toast.error(msg || "Failed to request verification");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    const handleApprove = async () => {
        if (!token || !targetUserId) return;
        setLoading(true);
        try {
            if (user?.role === 'SUPER_ADMIN') {
                await adminService.verifyAdmin(Number(targetUserId), true);
                toast.success("User approved successfully");
                const data = await fetchProfileApi(token, targetUserId);
                setFormData(prev => ({ ...prev, ...data }));
            } else {
                const response = await fetch(`http://localhost:8080/api/users/verification/${targetUserId}/approve`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    toast.success("User approved successfully");
                    // Refresh data
                    const data = await fetchProfileApi(token, targetUserId);
                    setFormData(prev => ({ ...prev, ...data }));
                } else {
                    toast.error("Failed to approve user");
                }
            }
        } catch (error) { toast.error("An error occurred"); } finally { setLoading(false); }
    }

    const handleReject = async () => {
        if (!token || !targetUserId) return;
        setLoading(true);
        setIsRejectDialogOpen(false);

        try {
            if (user?.role === 'SUPER_ADMIN') {
                await adminService.verifyAdmin(Number(targetUserId), false, rejectionReason);
                toast.success("User rejected");
                const data = await fetchProfileApi(token, targetUserId);
                setFormData(prev => ({ ...prev, ...data }));
            } else {
                const response = await fetch(`http://localhost:8080/api/users/verification/${targetUserId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(rejectionReason)
                });
                if (response.ok) {
                    toast.success("User rejected");
                    // Refresh data
                    const data = await fetchProfileApi(token, targetUserId);
                    setFormData(prev => ({ ...prev, ...data }));
                } else {
                    toast.error("Failed to reject user");
                }
            }
        } catch (error) { toast.error("An error occurred"); } finally {
            setLoading(false);
            setRejectionReason("");
        }
    }

    return (
        <div className="space-y-6">
            {/* Banner Section */}
            <div className="relative w-full">
                <div className="h-32 w-full bg-gradient-to-r from-primary/80 via-[var(--gradient-blue)] to-[var(--gradient-purple)] rounded-xl shadow-md overflow-hidden">
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Profile Header Content */}
                <div className="px-6 relative -mt-12 flex flex-col items-center text-center">
                    {/* Avatar Group */}
                    <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                        <Avatar className="h-40 w-40 border-4 border-background shadow-xl">
                            <AvatarImage src={formData.profilePicture} alt={formData.fullName} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-muted">{formData.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isEditMode && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* User Info */}
                    <div className="pt-3 space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">{formData.fullName}</h1>
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                                {formData.role.replace('_', ' ')}
                            </Badge>
                            {formData.communityStatus === 'APPROVED' && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 px-2 py-0.5 text-xs">
                                    Verified
                                </Badge>
                            )}
                            {formData.communityStatus === 'PENDING' && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600 px-2 py-0.5 text-xs">
                                    Verification Pending
                                </Badge>
                            )}
                            {formData.communityStatus === 'REJECTED' && (
                                <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                    Rejected
                                </Badge>
                            )}
                        </div>
                        {/* Request Verification Button - Only for current user */}
                        {!isAdminView && (formData.communityStatus === 'NONE' || formData.communityStatus === 'REJECTED') && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 text-xs"
                                onClick={handleRequestVerification}
                                disabled={loading}
                            >
                                Request Verification
                            </Button>
                        )}

                        {/* Admin Actions - Only for PENDING requests */}
                        {isAdminView && formData.communityStatus === 'PENDING' && (
                            <div className="flex gap-2 mt-2">
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-8"
                                    onClick={handleApprove}
                                    disabled={loading}
                                >
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8"
                                    onClick={() => setIsRejectDialogOpen(true)}
                                    disabled={loading}
                                >
                                    Reject
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Dialog */}
            <Dialog
                open={isRejectDialogOpen}
                onOpenChange={(open) => {
                    setIsRejectDialogOpen(open);
                    if (!open) {
                        setRejectionReason("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Rejection</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting <span className="font-semibold text-foreground">{formData.fullName}</span>. This will be sent as a notification.
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
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20 group">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-xl text-foreground dark:text-slate-100">
                            <span className="p-2 bg-primary/10 rounded-lg text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            </span>
                            Personal Information
                        </CardTitle>

                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                disabled={!isEditMode}
                                className="h-10 bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:border-primary dark:focus:border-blue-500 focus:ring-primary/20 dark:focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Email Address</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    disabled={true}
                                    className="pl-9 bg-muted/50 dark:bg-slate-800 border-transparent dark:border-slate-700 text-foreground dark:text-slate-100"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 text-muted-foreground"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Role</Label>
                            <Select
                                disabled={true}
                                value={formData.role}
                                onValueChange={(val) => handleSelectChange('role', val)}
                            >
                                <SelectTrigger className="bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:ring-primary/20 dark:focus:ring-blue-500/20">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                                    <SelectItem value="COLLEGE_ADMIN">College Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-900/20 group">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-xl text-foreground dark:text-slate-100">
                            <span className="p-2 bg-secondary/10 rounded-lg text-secondary-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10v6" /><path d="M22 16a6 6 0 0 1-12 0" /><path d="M14 16a6 6 0 0 1-12 0" /><path d="m2 10 10-7 10 7" /></svg>
                            </span>
                            Professional & Academic
                        </CardTitle>

                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="collegeName" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">College / Institution</Label>
                            <div className="relative">
                                <Input
                                    id="collegeName"
                                    name="collegeName"
                                    value={formData.collegeName || 'Not Affiliated'}
                                    disabled={true}
                                    className="pl-9 bg-muted/50 dark:bg-slate-800 border-transparent dark:border-slate-700 text-foreground dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {(formData.role === 'DOCTOR') && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="specialization" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Specialization</Label>
                                    <Input
                                        id="specialization"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                        placeholder="e.g. Cardiologist"
                                        className="h-10 bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:border-primary dark:focus:border-blue-500 focus:ring-primary/20 dark:focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">License Number</Label>
                                    <Input
                                        id="licenseNumber"
                                        name="licenseNumber"
                                        value={formData.licenseNumber}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                        placeholder="Medical License ID"
                                        className="h-10 font-mono bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:border-primary dark:focus:border-blue-500 focus:ring-primary/20 dark:focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                                    />
                                </div>
                            </>
                        )}
                        {(formData.role === 'STUDENT') && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="registrationNumber" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Registration Number</Label>
                                    <Input
                                        id="registrationNumber"
                                        name="registrationNumber"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                        placeholder="University Reg. No."
                                        className="h-10 font-mono bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:border-primary dark:focus:border-blue-500 focus:ring-primary/20 dark:focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="course" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Course</Label>
                                        <Select
                                            disabled={!isEditMode}
                                            value={formData.course}
                                            onValueChange={(val) => handleSelectChange('course', val)}
                                        >
                                            <SelectTrigger className="bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:ring-primary/20 dark:focus:ring-blue-500/20">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CSE">CSE</SelectItem>
                                                <SelectItem value="MTECH">M.Tech</SelectItem>
                                                <SelectItem value="MCA">MCA</SelectItem>
                                                <SelectItem value="MSC">M.Sc</SelectItem>
                                                <SelectItem value="MBA">MBA</SelectItem>
                                                <SelectItem value="PHD">PhD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="studentYear" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">Year</Label>
                                        <Select
                                            disabled={!isEditMode}
                                            value={formData.studentYear}
                                            onValueChange={(val) => handleSelectChange('studentYear', val)}
                                        >
                                            <SelectTrigger className="bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:ring-primary/20 dark:focus:ring-blue-500/20">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1st Year</SelectItem>
                                                <SelectItem value="2">2nd Year</SelectItem>
                                                <SelectItem value="3">3rd Year</SelectItem>
                                                <SelectItem value="4">4th Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                        {(formData.role === 'COLLEGE_ADMIN') && (
                            <div className="space-y-2">
                                <Label htmlFor="collegeIdNumber" className="text-secondary-foreground/80 dark:text-slate-400 font-medium">College ID Number</Label>
                                <Input
                                    id="collegeIdNumber"
                                    name="collegeIdNumber"
                                    value={formData.collegeIdNumber || ''}
                                    onChange={handleChange}
                                    disabled={!isEditMode}
                                    placeholder="Admin ID"
                                    className="h-10 font-mono bg-background dark:bg-slate-800 border-input dark:border-slate-700 text-foreground dark:text-slate-100 focus:border-primary dark:focus:border-blue-500 focus:ring-primary/20 dark:focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isEditMode && (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    )
}

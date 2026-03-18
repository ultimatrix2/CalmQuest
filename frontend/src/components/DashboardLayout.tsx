import { AppSidebar } from "@/components/app-sidebar"
import { Notifications } from "@/components/Notifications"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { Outlet, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { authService } from "@/services/authService"
import { SosButton } from "@/components/SosButton"



export default function DashboardLayout() {
    const [isEditMode, setIsEditMode] = useState(false)
    const location = useLocation()

    // Reset edit mode when route changes
    useEffect(() => {
        setIsEditMode(false)
    }, [location.pathname])

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode)
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>

                                {location.pathname.split('/').filter(Boolean).map((segment, index, array) => {
                                    const href = `/${array.slice(0, index + 1).join('/')}`;
                                    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
                                    const isLast = index === array.length - 1;

                                    return (
                                        <div key={href} className="flex items-center gap-2">
                                            <BreadcrumbSeparator className="hidden md:block" />
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage>{title}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </div>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center gap-2 ml-auto px-4">
                        {/* Edit Profile Button - Only visible on Profile Page and NOT when viewing another user */}
                        {location.pathname.includes('/profile') && !location.search.includes('userId') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleEditMode}
                                className="hidden md:flex"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {isEditMode ? 'Cancel Edit' : 'Edit Profile'}
                            </Button>
                        )}
                        <Notifications />
                        <ThemeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Outlet context={{ isEditMode, setIsEditMode }} />
                </div>
                {authService.getCurrentUser()?.role === "STUDENT" && <SosButton />}
            </SidebarInset>
        </SidebarProvider>
    )
}

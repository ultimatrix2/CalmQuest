import * as React from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"
import {
    BookOpen,
    Bot,
    SquareTerminal,
    Brain,
    ShieldCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
    // User data is now fetched from Redux, removing hardcoded user
    navMain: [
        {
            title: "Community",
            url: "/dashboard/community",
            icon: SquareTerminal,
            isActive: true,
            items: [],
        },
        {
            title: "Doctor",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Appointment",
                    url: "#",
                },
                {
                    title: "History",
                    url: "#",
                },
            ],
        },
        {
            title: "AI Diagnosis",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Chat",
                    url: "/dashboard/chat",
                },
                {
                    title: "Report",
                    url: "/dashboard/report",
                },
                {
                    title: "History",
                    url: "/dashboard/assessment-history",
                },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useSelector((state: RootState) => state.auth)

    const sidebarUser = {
        name: user?.fullName || "User",
        email: user?.email || "",
        profilePicture: user?.profilePicture || "",
    }

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN';
    const dynamicNavMain = [...data.navMain];

    if (isAdmin) {
        dynamicNavMain.push({
            title: "Admin Dashboard",
            url: "/dashboard/admin",
            icon: ShieldCheck,
            items: [],
            isActive: false,
        });
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 shadow-sm">
                                <Brain className="size-5 text-white" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">CalmQuest</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={dynamicNavMain} user={user ? { ...user, communityStatus: user.communityStatus || 'NONE' } : null} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={sidebarUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

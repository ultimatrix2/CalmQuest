import * as React from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"
import {
    BookOpen,
    Bot,
    SquareTerminal,
    Brain,
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
            url: "#",
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
                    url: "#",
                },
                {
                    title: "Report",
                    url: "#",
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

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Brain className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">CalmQuest</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} communityStatus={user?.communityStatus} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={sidebarUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

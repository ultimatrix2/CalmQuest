import { ChevronRight, type LucideIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
    items,
    user,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
    user?: { role: string; communityStatus: string } | null
}) {
    const navigate = useNavigate()

    const handleNavigation = (url: string, title: string) => {
        // Only SUPER_ADMIN is intrinsically allowed, everyone else needs to be APPROVED.
        const isSuperAdmin = user?.role === 'SUPER_ADMIN';
        const isApproved = user?.communityStatus === 'APPROVED';

        if (!isSuperAdmin && !isApproved && url !== '/dashboard/profile') {
            const approver = user?.role === 'COLLEGE_ADMIN' ? 'the Super Admin' : 'your College Admin';
            toast.error(`Please wait for ${approver} to verify you before accessing ${title}`)
            navigate('/dashboard/profile')
            return
        }
        navigate(url)
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    !item.items || item.items.length === 0 ? (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                className="cursor-pointer"
                                onClick={() => handleNavigation(item.url, item.title)}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ) : (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.isActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild className="cursor-pointer">
                                                    <div onClick={() => handleNavigation(subItem.url, item.title)}>
                                                        <span>{subItem.title}</span>
                                                    </div>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    )
                )}
            </SidebarMenu>
        </SidebarGroup>
    )
}


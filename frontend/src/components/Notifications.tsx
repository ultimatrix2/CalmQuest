import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Bell } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { RootState } from "@/store/store"
import { toast } from "sonner"

interface Notification {
    id: number
    message: string
    type: 'VERIFICATION_REQUEST' | 'VERIFICATION_RESULT' | 'GENERAL'
    link?: string
    isRead: boolean
    createdAt: string
}

export function Notifications() {
    const { token } = useSelector((state: RootState) => state.auth)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const navigate = useNavigate()

    const unreadCount = notifications.filter(n => !n.isRead).length

    const fetchNotifications = async () => {
        if (!token) return
        try {
            const response = await fetch('http://localhost:8080/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error)
            toast.error("Failed to fetch notifications")
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [token])

    const handleMarkAsRead = async (id: number) => {
        if (!token) return
        try {
            await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        } catch (error) {
            console.error("Failed to mark as read", error)
        }
    }

    const handleClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id)
        }
        if (notification.link) {
            navigate(notification.link)
        }
    }

    const markAllRead = async () => {
        // Optimistic update
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

        for (const id of unreadIds) {
            await handleMarkAsRead(id)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto px-2 text-xs" onClick={markAllRead}>
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50 font-medium' : ''}`}
                            onClick={() => handleClick(notification)}
                        >
                            <div className="flex justify-between w-full">
                                <span className="text-xs text-muted-foreground">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                                {!notification.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                            </div>
                            <p className="text-sm leading-tight">
                                {notification.message}
                            </p>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

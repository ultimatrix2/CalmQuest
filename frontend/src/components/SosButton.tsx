import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { 
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { authService } from "@/services/authService"
import { toast } from "sonner"

export function SosButton() {
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleTriggerSos = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('http://localhost:8080/api/sos/trigger', {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeader()
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to trigger SOS alert')
            }

            toast.success("🚨 Emergency SOS Alert Sent", {
                description: "College authorities and doctors have been notified.",
                duration: 5000,
            })
            setIsOpen(false)
        } catch (error: any) {
            toast.error("Failed to send SOS", {
                description: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size="icon" 
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 bg-red-600 hover:bg-red-700 animate-pulse"
                    aria-label="Emergency SOS"
                >
                    <AlertTriangle className="h-7 w-7 text-white" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-red-500/20 shadow-red-500/10 max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl text-red-600">Trigger Emergency SOS?</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base text-foreground/80">
                        This action will immediately alert college doctors and administrators that you are in a crisis situation. 
                        Use this <strong>only in genuine emergencies</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 sm:justify-between flex-row-reverse">
                    <Button 
                        variant="destructive" 
                        onClick={handleTriggerSos} 
                        disabled={isLoading}
                        className="w-full sm:w-auto font-bold bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                        ) : "Yes, Trigger SOS"}
                    </Button>
                    <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto mt-0 ml-2">
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

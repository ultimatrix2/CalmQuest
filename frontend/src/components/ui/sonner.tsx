import { useSelector } from "react-redux"
import { Toaster as Sonner } from "sonner"
import type { RootState } from "@/store/store"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useSelector((state: RootState) => state.theme)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      {...props}
    />
  )
}

export { Toaster }

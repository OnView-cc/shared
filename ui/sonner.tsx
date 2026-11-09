/**
 * Las notificaciones: una hoja de niebla con el filete del mundo y la esquina
 * de 2px (la piel va en `styles/sky.css`, `.site.sk [data-sonner-toast]`). Blue
 * Hour es oscuro entero: el tema de sonner va fijo en oscuro y los colores salen
 * de los tokens `--sk-*`, con respaldo escrito por si un aviso cae fuera de `.sk`.
 */
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--sk-mist, #0d1530)",
          "--normal-text": "var(--sk-ink, #e9ecf5)",
          "--normal-border": "var(--sk-hair-2, rgba(233, 236, 245, 0.2))",
          "--border-radius": "2px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

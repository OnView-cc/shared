/* eslint-disable react-refresh/only-export-components */
/**
 * OnView es oscuro entero (Ventana, como antes Feed vertical): el mismo casi
 * negro fuera y dentro. No hay tema claro ni lo elige el sistema.
 *
 * Este proveedor sobrevive para que las apps que lo montan sigan compilando. No
 * lee `localStorage` ni escucha al sistema: pone la clase `dark` en la raíz
 * (los componentes de shadcn la leen) y quita `light`; `useTheme` devuelve
 * siempre «dark» y un `setTheme` que no hace nada.
 */
import * as React from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const DARK: ThemeProviderState = { theme: "dark", setTheme: () => {} }

const ThemeProviderContext = React.createContext<ThemeProviderState>(DARK)

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light")
    root.classList.add("dark")
  }, [])

  return (
    <ThemeProviderContext.Provider value={DARK}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => React.useContext(ThemeProviderContext)

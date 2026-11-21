/**
 * Dónde montan sus paneles las piezas de Radix de Ventana (`Select`, `Menu`,
 * `Popover`, `Tooltip`).
 *
 * Por defecto, en `document.body`. Pero `Sheet` y la hoja estrecha de `NavBar` son
 * `<dialog>` abiertos con `showModal()`: viven en la capa superior y dejan inerte
 * el resto del documento, así que un panel montado en `body` quedaría debajo del
 * diálogo y sin responder. Esas dos piezas dan su `<dialog>` por este contexto y
 * los paneles lo usan como `container` del portal de Radix: el panel se monta
 * DENTRO del diálogo, encima y vivo. Fuera de un diálogo el valor es `undefined`
 * y Radix vuelve a `body`.
 *
 * El envoltorio `<div className="vn" style="display: contents">` del panel se
 * queda también dentro del diálogo: un `.vn` dentro de otro no cambia nada.
 */
import { createContext, useContext } from "react";

export const PortalHost = createContext<HTMLElement | undefined>(undefined);

/** El elemento donde montar un portal: el `<dialog>` de la hoja que lo contiene, o `undefined` (Radix usa `body`). */
export function usePortalHost(): HTMLElement | undefined {
	return useContext(PortalHost);
}

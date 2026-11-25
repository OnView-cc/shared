/**
 * La hoja de Ventana, sobre el `<dialog>` nativo: el sistema ya atrapa el foco, lo
 * devuelve al cerrar y sabe de Escape. Es el equivalente de `SheetDialog` de
 * `sky/console.tsx` con la misma firma y el mismo comportamiento, más `closeLabel`
 * (el nombre accesible del aspa: sky lo tenía escrito a mano). No se importa de
 * sky: es una pieza nueva en el mundo nuevo.
 *
 * Se reserva para los actos que no se deshacen (rotar un secreto, borrar) y para
 * el secreto que se enseña una sola vez, que se abre con `dismissable={false}`:
 * ni Escape ni un clic fuera lo cierran, sólo la confirmación de dentro.
 *
 * Material: el propio `<dialog>` es el vidrio grueso y lleva la clase raíz `vn`
 * (vive en la capa superior, fuera de cualquier `.vn`). Bajo 40rem es una hoja
 * pegada abajo; desde 40rem, un diálogo centrado. El movimiento y el fondo son CSS
 * puro (`styles/ventana/overlays.css`).
 *
 * El contenido y el pie se montan junto con `open` (sus efectos corren después de `showModal`;
 * sus efectos de maquetado, ANTES, con el diálogo aún en `display: none`: lo que se mide ahí,
 * como `TextArea` o `Segmented`, se vuelve a medir con un `ResizeObserver` al abrirse)
 * y siguen montados mientras la hoja sale: se desmontan cuando acaba la transición de salida
 * del propio `<dialog>` (opacidad) o, si el navegador no la emite (jsdom, sin movimiento),
 * a los `EXIT_FALLBACK_MS`. Reabrir durante la salida los conserva.
 *
 * `[data-autofocus]` lleva el foco a donde el consumidor diga (un diálogo que
 * confirma lleva el foco a «Cancelar», el lado que no hace nada).
 *
 * Los paneles de Radix de dentro (`Select`, `Menu`, `Popover`, `Tooltip`) se montan
 * dentro del propio `<dialog>` (`PortalHost`, `portal-host.ts`): en `body` quedarían
 * debajo de la capa superior e inertes. Por eso el diálogo no recorta (`overflow`
 * visible: un panel puede salir de la hoja) y lo que recorta, con las esquinas del
 * diálogo, es el marco de dentro (`vn-sheet__frame`).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./button";
import { PortalHost } from "./portal-host";

/** Algo más que la salida más larga (240ms) de `overlays.css`. */
const EXIT_FALLBACK_MS = 400;

export function Sheet({
	open,
	onClose,
	title,
	description,
	dismissable = true,
	closeLabel,
	children,
	footer,
	size = "default",
}: {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	description?: ReactNode;
	dismissable?: boolean;
	/** Nombre accesible del aspa; llega del diccionario del consumidor. */
	closeLabel: string;
	children?: ReactNode;
	footer?: ReactNode;
	/** `wide`: desde 40rem la hoja mide 40rem en vez de 32 (formularios de dos columnas, listas). */
	size?: "default" | "wide";
}): ReactElement {
	const ref = useRef<HTMLDialogElement>(null);
	// El diálogo existe siempre (sólo su contenido se monta con `open`): se toma una vez, al montarse
	const [host, setHost] = useState<HTMLDialogElement | undefined>(undefined);
	useLayoutEffect(() => setHost(ref.current ?? undefined), []);
	const titleId = useId();
	const descId = useId();
	// Saliendo: `open` acaba de pasar a falso y la hoja aún se desvanece. Se deduce al renderizar
	// (no en un efecto) para que el contenido no se desmonte ni un instante.
	const [exiting, setExiting] = useState(false);
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		setExiting(!open);
	}
	const mounted = open || exiting;

	useEffect(() => {
		if (!exiting) return;
		const timer = setTimeout(() => setExiting(false), EXIT_FALLBACK_MS);
		return () => clearTimeout(timer);
	}, [exiting]);

	// Un efecto de maquetado: abre el diálogo antes de que corran los efectos de su
	// contenido, que así pueden llevar el foco a donde quieran.
	useLayoutEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// `showModal` enfoca lo primero enfocable, que es el aspa de cerrar.
			dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
		}
		if (!open && dialog.open) dialog.close();
	}, [open]);

	// El teclado del teléfono no encoge la página (iOS, y Android sin
	// `interactive-widget`): mientras la hoja está abierta se mide cuánto tapa
	// (`visualViewport`) y la hoja se aparta y encoge esa altura, para que su pie
	// («Guardar») quede a la vista. Sin `visualViewport` no se hace nada.
	useEffect(() => {
		const dialog = ref.current;
		const vv = typeof window !== "undefined" ? window.visualViewport : null;
		if (!open || !dialog || !vv) return;
		const update = () => {
			const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
			dialog.style.setProperty("--vn-keyboard-inset", `${inset}px`);
		};
		update();
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
			dialog.style.removeProperty("--vn-keyboard-inset");
		};
	}, [open]);

	return (
		<dialog
			ref={ref}
			className="vn vn-glass vn-glass--thick vn-sheet vn-sheet-scrim"
			data-size={size === "wide" ? "wide" : undefined}
			aria-labelledby={titleId}
			aria-describedby={description ? descId : undefined}
			onCancel={(e) => {
				e.preventDefault();
				if (dismissable) onClose();
			}}
			onTransitionEnd={(e) => {
				// Sólo la opacidad del propio diálogo: la transición de un hijo no acaba la salida
				if (exiting && e.target === e.currentTarget && e.propertyName === "opacity") setExiting(false);
			}}
			onClick={(e) => {
				if (dismissable && e.target === e.currentTarget) onClose();
			}}>
			<PortalHost.Provider value={host}>
				<div className="vn-sheet__frame">
					<div className="vn-sheet__head">
						<div className="vn-sheet__titles">
							<h2 id={titleId} className="vn-title-2 vn-sheet__title">
								{title}
							</h2>
							{description && (
								<p id={descId} className="vn-body vn-sheet__desc">
									{description}
								</p>
							)}
						</div>
						{dismissable && (
							<IconButton label={closeLabel} onClick={onClose} className="vn-sheet__close">
								<X size={18} strokeWidth={1.75} aria-hidden="true" />
							</IconButton>
						)}
					</div>
					{children && <div className="vn-sheet__body">{mounted && children}</div>}
					{footer && mounted && <div className="vn-sheet__foot">{footer}</div>}
				</div>
			</PortalHost.Provider>
		</dialog>
	);
}

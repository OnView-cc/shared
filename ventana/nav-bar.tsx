/**
 * La barra de navegación de Ventana: una cápsula de vidrio fino que flota.
 *
 * La pieza no se posiciona: el `<header class="vn-nav">` es un bloque normal y quien
 * la monta decide dónde flota (fija arriba, pegajosa, dentro de un marco). Aquí vive
 * la cápsula (`<nav aria-label>`) y su comportamiento.
 *
 * Desde 48rem: la marca, los enlaces (`children`) en fila y las acciones (`end`) al
 * otro lado. Por debajo (`useNarrow`): la marca y un botón de menú que abre una hoja
 * de vidrio grueso pegada ARRIBA, con los enlaces y las acciones apilados. La hoja es
 * un `<dialog>` nativo abierto con `showModal`, como `Sheet`: el sistema atrapa el foco,
 * sabe de Escape y deja inerte la página de detrás. Elegir un enlace, Escape, el aspa o
 * un clic en el fondo la cierran y el foco vuelve al botón. Si la ventana crece con la
 * hoja abierta, se cierra. Los enlaces se montan una sola vez: en la cápsula si es
 * ancha, en la hoja (dentro de su propio `<nav>`) si es estrecha (y sólo mientras está abierta o saliendo).
 *
 * `compact` (`data-compact`) la encoge de 52px a 44px, y lo decide quien la monta
 * (por ejemplo al bajar la página). Su capa oscura sube a la del grueso cambiando la
 * clase del material (`vn-glass--thick`), no declarando propiedades del vidrio.
 *
 * Todo texto visible llega por props. Diferencia con `Sheet`: la cortina es la misma
 * clase (`vn-sheet-scrim`), pero no hay título (la hoja se nombra con `label`).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useNarrow } from "../sky/hooks";
import { IconButton } from "./button";

/** Algo más que la salida más larga (240ms) de `overlays.css`. */
const EXIT_FALLBACK_MS = 400;

export function NavBar({
	label,
	brand,
	children,
	end,
	menuLabel,
	closeLabel,
	compact = false,
}: {
	/** Nombre accesible del `<nav>` (y de la hoja). */
	label: string;
	brand: ReactNode;
	/** Los enlaces. Los de la página actual llevan `aria-current="page"`. */
	children?: ReactNode;
	/** Las acciones, al extremo de la barra. */
	end?: ReactNode;
	menuLabel: string;
	closeLabel: string;
	/** Se encoge: lo decide quien la monta. */
	compact?: boolean;
}): ReactElement {
	const narrow = useNarrow();
	const panelId = useId();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const navRef = useRef<HTMLElement>(null);
	const menuRef = useRef<HTMLButtonElement>(null);
	const wasOpen = useRef(false);
	const [open, setOpen] = useState(false);
	// Saliendo: `open` acaba de pasar a falso y la hoja aún se desvanece. Se deduce al
	// renderizar (no en un efecto) para que el contenido no se desmonte ni un instante.
	const [exiting, setExiting] = useState(false);
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		setExiting(!open);
	}
	// Al ensancharse la ventana la hoja desaparece y no debe reaparecer abierta al estrecharse
	if (!narrow && open) setOpen(false);
	const mounted = open || exiting;

	useEffect(() => {
		if (!exiting) return;
		const timer = setTimeout(() => setExiting(false), EXIT_FALLBACK_MS);
		return () => clearTimeout(timer);
	}, [exiting]);

	// De maquetado: abre antes de que corran los efectos del contenido
	useLayoutEffect(() => {
		const dialog = dialogRef.current;
		if (open && dialog && !dialog.open) dialog.showModal();
		if (!open) {
			if (dialog?.open) dialog.close();
			// Al cerrar el foco vuelve al botón; si la ventana creció y el botón ya no existe, a la cápsula
			if (wasOpen.current) (menuRef.current ?? navRef.current)?.focus();
		}
		wasOpen.current = open;
	}, [open]);

	const stack = (
		<div className="vn-nav__stack">
			{/* El punto de referencia de navegación sigue ahí mientras la hoja está abierta */}
			<nav aria-label={label} className="vn-nav__links vn-nav__links--stack">
				{children}
			</nav>
			{end && <div className="vn-nav__end vn-nav__end--stack">{end}</div>}
		</div>
	);

	return (
		<header className="vn-nav">
			<nav
				ref={navRef}
				tabIndex={-1}
				aria-label={label}
				data-compact={compact ? "" : undefined}
				className={`vn vn-glass ${compact ? "vn-glass--thick" : "vn-glass--thin"} vn-nav__bar`}>
				<div className="vn-nav__brand">{brand}</div>
				{narrow ? (
					<IconButton
						ref={menuRef}
						label={menuLabel}
						variant="plain"
						className="vn-nav__menu"
						aria-expanded={open}
						aria-controls={panelId}
						onClick={() => setOpen(true)}>
						<Menu size={20} strokeWidth={1.75} aria-hidden="true" />
					</IconButton>
				) : (
					<>
						<div className="vn-nav__links">{children}</div>
						{end && <div className="vn-nav__end">{end}</div>}
					</>
				)}
			</nav>
			{narrow && (
				<dialog
					ref={dialogRef}
					id={panelId}
					aria-label={label}
					className="vn vn-glass vn-glass--thick vn-nav-sheet vn-sheet-scrim"
					onCancel={(e) => {
						e.preventDefault();
						setOpen(false);
					}}
					onClose={() => setOpen(false)}
					onTransitionEnd={(e) => {
						if (exiting && e.target === e.currentTarget && e.propertyName === "opacity") setExiting(false);
					}}
					onClick={(e) => {
						// Un clic en el propio diálogo es un clic en el fondo; dentro, sólo un clic simple en un
						// enlace la cierra (no con modificadores, ni otro botón, ni en pestaña nueva)
						if (e.target === e.currentTarget) return setOpen(false);
						const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
						if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;
						setOpen(false);
					}}>
					<div className="vn-nav-sheet__inner">
						<div className="vn-nav-sheet__head">
							<IconButton label={closeLabel} variant="plain" onClick={() => setOpen(false)}>
								<X size={20} strokeWidth={1.75} aria-hidden="true" />
							</IconButton>
						</div>
						{mounted && stack}
					</div>
				</dialog>
			)}
		</header>
	);
}

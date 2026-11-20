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
 * `[data-autofocus]` lleva el foco a donde el consumidor diga (un diálogo que
 * confirma lleva el foco a «Cancelar», el lado que no hace nada).
 */
import { useId, useLayoutEffect, useRef, type ReactElement, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./button";

export function Sheet({
	open,
	onClose,
	title,
	description,
	dismissable = true,
	closeLabel,
	children,
	footer,
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
}): ReactElement {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const descId = useId();

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

	return (
		<dialog
			ref={ref}
			className="vn vn-glass vn-glass--thick vn-sheet vn-sheet-scrim"
			aria-labelledby={titleId}
			aria-describedby={description ? descId : undefined}
			onCancel={(e) => {
				e.preventDefault();
				if (dismissable) onClose();
			}}
			onClick={(e) => {
				if (dismissable && e.target === e.currentTarget) onClose();
			}}>
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
			{children && <div className="vn-sheet__body">{open && children}</div>}
			{footer && open && <div className="vn-sheet__foot">{footer}</div>}
		</dialog>
	);
}

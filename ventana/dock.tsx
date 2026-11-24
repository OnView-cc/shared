/**
 * El dock de Ventana: la navegación de la app, una cápsula de vidrio que flota
 * abajo y al centro, igual en escritorio y teléfono (spec 2026-11-23-onview-app-
 * ventana §5). Siempre es vidrio ahumado: abajo pasa contenido del usuario desde
 * el primer cuadro, y la garantía del ahumado es contra blanco puro.
 *
 * - **Ancho (desde 48rem):** los destinos con su texto, la acción principal como
 *   botón blanco con su palabra, un filete y `meta` (el saldo).
 * - **Estrecho:** el primer destino, la acción como botón redondo blanco con un
 *   + (su palabra es el nombre accesible) y los demás destinos, cada uno con su
 *   ícono y su texto pequeño debajo. Sin `meta`.
 * - `current` marca el destino actual con `aria-current="page"`: filete por dentro
 *   y más peso, nunca un relleno más claro (sobre vidrio, aclarar baja el contraste).
 * - `compact` (lo decide quien lo monta, al bajar la página en el teléfono) lo
 *   deja en iconos y el +. `hidden` lo aparta hacia abajo y lo vuelve `inert`
 *   (con el teclado abierto); con movimiento reducido sólo cambia la opacidad.
 *
 * La pieza se posiciona sola (fija abajo, sobre el área segura). Todo texto llega
 * por props.
 */
import type { ReactElement, ReactNode } from "react";
import { Plus } from "lucide-react";
import { useNarrow } from "../sky/hooks";
import type { LinkLike } from "./link";

export interface DockItem {
	key: string;
	label: string;
	href: string;
	icon: ReactNode;
	current?: boolean;
}

function Item({ item, narrow, Link }: { item: DockItem; narrow: boolean; Link: LinkLike }) {
	return (
		// En estrecho, encogido, el CSS quita la etiqueta (display: none) y el icono es aria-hidden:
		// sin `aria-label` el enlace se quedaría sin nombre para un lector de pantalla
		<Link href={item.href} className="vn-dock__item" aria-label={narrow ? item.label : undefined} aria-current={item.current ? "page" : undefined}>
			{narrow && (
				<span className="vn-dock__icon" aria-hidden="true">
					{item.icon}
				</span>
			)}
			<span className="vn-dock__label">{item.label}</span>
		</Link>
	);
}

/** Las clases del botón primario pequeño de `Button`, para pintarlo con el enlace del enrutador. */
const ACTION_CLASSES = "vn-btn vn-btn--primary vn-btn--sm vn-press vn-dock__action";

export function Dock({
	label,
	items,
	action,
	meta,
	compact = false,
	hidden = false,
	linkAs: Link = "a",
}: {
	label: string;
	items: DockItem[];
	action: { label: string; href: string };
	meta?: ReactNode;
	compact?: boolean;
	hidden?: boolean;
	/** El enlace del enrutador de quien lo monta; por defecto un `<a>`. */
	linkAs?: LinkLike;
}): ReactElement {
	const narrow = useNarrow();
	const [first, ...rest] = items;
	return (
		<nav
			aria-label={label}
			className="vn-dock vn-glass vn-glass--thin"
			data-narrow={narrow ? "" : undefined}
			data-compact={compact ? "" : undefined}
			data-hidden={hidden ? "" : undefined}
			inert={hidden || undefined}>
			{narrow ? (
				<>
					{first && <Item item={first} narrow Link={Link} />}
					<Link href={action.href} className="vn-dock__plus" aria-label={action.label}>
						<Plus aria-hidden="true" />
					</Link>
					{rest.map((item) => (
						<Item key={item.key} item={item} narrow Link={Link} />
					))}
				</>
			) : (
				<>
					{items.map((item) => (
						<Item key={item.key} item={item} narrow={false} Link={Link} />
					))}
					<Link href={action.href} className={ACTION_CLASSES}>
						<Plus aria-hidden="true" />
						<span className="vn-btn__label">{action.label}</span>
					</Link>
					{meta != null && (
						<>
							<span className="vn-dock__sep" aria-hidden="true" />
							<span className="vn-dock__meta">{meta}</span>
						</>
					)}
				</>
			)}
		</nav>
	);
}

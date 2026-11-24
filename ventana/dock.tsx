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
import { Button } from "./button";

export interface DockItem {
	key: string;
	label: string;
	href: string;
	icon: ReactNode;
	current?: boolean;
}

function Item({ item, narrow }: { item: DockItem; narrow: boolean }) {
	return (
		<a href={item.href} className="vn-dock__item" aria-current={item.current ? "page" : undefined}>
			{narrow && (
				<span className="vn-dock__icon" aria-hidden="true">
					{item.icon}
				</span>
			)}
			<span className="vn-dock__label">{item.label}</span>
		</a>
	);
}

export function Dock({
	label,
	items,
	action,
	meta,
	compact = false,
	hidden = false,
}: {
	label: string;
	items: DockItem[];
	action: { label: string; href: string };
	meta?: ReactNode;
	compact?: boolean;
	hidden?: boolean;
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
					{first && <Item item={first} narrow />}
					<a href={action.href} className="vn-dock__plus" aria-label={action.label}>
						<Plus aria-hidden="true" />
					</a>
					{rest.map((item) => (
						<Item key={item.key} item={item} narrow />
					))}
				</>
			) : (
				<>
					{items.map((item) => (
						<Item key={item.key} item={item} narrow={false} />
					))}
					<Button href={action.href} size="sm" className="vn-dock__action">
						<Plus aria-hidden="true" />
						{action.label}
					</Button>
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

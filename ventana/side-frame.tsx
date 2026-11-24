/**
 * El armazón con barra lateral de Ventana: la consola de administración (spec
 * 2026-11-24-onview-admin-correos-ventana §4.1).
 *
 * - **Ancho (desde 64rem):** una barra de vidrio ahumado grueso que flota a la
 *   izquierda, separada del borde, con la marca arriba, las secciones en un
 *   `<nav>` con nombre y la cuenta abajo. La sección actual lleva
 *   `aria-current="page"`: filete por dentro y fondo oscurecido, nunca aclarado.
 *   Una sección con `count > 0` pinta la cifra en una cápsula, con `countLabel`
 *   como texto para el lector de pantalla.
 * - **Estrecho:** la barra de arriba de Ventana (`NavBar`) con la marca y un botón
 *   de menú; las secciones y la cuenta viven en su hoja, que se cierra al elegir.
 *
 * Lo de dentro (`<main>`) es sólido: lo monta quien usa la pieza. Todo texto
 * llega por props; `linkAs` deja pasar el enlace del enrutador.
 */
import type { ReactElement, ReactNode } from "react";
import { useNarrow } from "./hooks";
import type { LinkLike } from "./link";
import { NavBar } from "./nav-bar";

export interface SideNavItem {
	key: string;
	label: string;
	href: string;
	icon: ReactNode;
	current?: boolean;
	/** Lo que espera en la sección; se pinta sólo si es mayor que cero. */
	count?: number;
	/** Lo que dice el lector de pantalla junto a la cifra («3 past due»). */
	countLabel?: string;
}

/** Desde dónde la barra lateral pasa a la barra de arriba con hoja. */
export const SIDE_NARROW = "(max-width: 63.9rem)";

function Links({ items, Link }: { items: SideNavItem[]; Link: LinkLike }) {
	return (
		<>
			{items.map((item) => (
				<Link key={item.key} href={item.href} className="vn-side__link" aria-current={item.current ? "page" : undefined}>
					<span className="vn-side__icon" aria-hidden="true">
						{item.icon}
					</span>
					<span className="vn-side__label">{item.label}</span>
					{item.count != null && item.count > 0 && (
						<span className="vn-side__count">
							<span aria-hidden="true">{item.count}</span>
							<span className="vn-sr-only">{item.countLabel ?? String(item.count)}</span>
						</span>
					)}
				</Link>
			))}
		</>
	);
}

export function SideFrame({
	brand,
	label,
	items,
	account,
	menuLabel,
	closeLabel,
	linkAs: Link = "a",
	children,
}: {
	brand: ReactNode;
	/** Nombre accesible del `<nav>` de las secciones. */
	label: string;
	items: SideNavItem[];
	/** Abajo de la barra (o al final de la hoja): el avatar y su menú. */
	account: ReactNode;
	menuLabel: string;
	closeLabel: string;
	linkAs?: LinkLike;
	children: ReactNode;
}): ReactElement {
	const narrow = useNarrow(SIDE_NARROW);
	if (narrow) {
		return (
			<div className="vn vn-page vn-side" data-narrow="">
				<div className="vn-side__top">
					<NavBar label={label} brand={brand} end={account} menuLabel={menuLabel} closeLabel={closeLabel} narrowQuery={SIDE_NARROW}>
						<Links items={items} Link={Link} />
					</NavBar>
				</div>
				<main className="vn-side__main">{children}</main>
			</div>
		);
	}
	return (
		<div className="vn vn-page vn-side">
			<aside className="vn-side__bar vn-glass vn-glass--thick">
				<div className="vn-side__brand">{brand}</div>
				<nav aria-label={label} className="vn-side__nav">
					<Links items={items} Link={Link} />
				</nav>
				<div className="vn-side__account">{account}</div>
			</aside>
			<main className="vn-side__main">{children}</main>
		</div>
	);
}

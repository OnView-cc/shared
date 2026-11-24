/**
 * El armazón de la app en Ventana (spec 2026-11-23-onview-app-ventana §5): la
 * raíz `.vn` (vidrio ahumado: la app enseña contenido del usuario y nunca va en
 * una zona luminosa), el resplandor detrás con los colores del kit, arriba la
 * marca y la cuenta sin vidrio y, abajo, el dock que monte quien lo use.
 *
 * - `back`: en vez de la marca, una cápsula de vidrio «‹ {label}» y el título en
 *   medio. Es la variante sin dock (la conversación con Iris; en la parte 4, el
 *   editor).
 * - Con `dock`, el contenido reserva abajo el hueco del dock (más el área segura),
 *   así que nada queda tapado. El `footer` va al final del contenido, antes del
 *   hueco.
 *
 * Todo texto llega por props.
 */
import type { ReactElement, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Glow } from "./glass";

export function AppFrame({
	brand,
	account,
	dock,
	back,
	glow,
	footer,
	children,
}: {
	brand: ReactNode;
	account: ReactNode;
	dock?: ReactNode;
	back?: { label: string; href: string; title?: ReactNode };
	glow?: string[];
	footer?: ReactNode;
	children: ReactNode;
}): ReactElement {
	return (
		<div className="vn vn-page vn-app">
			<div className="vn-app__glow" aria-hidden="true">
				<Glow colors={glow} />
			</div>
			<header className="vn-app__top" data-back={back ? "" : undefined}>
				{back ? (
					<>
						<a href={back.href} className="vn-app__back vn-glass vn-glass--thin vn-press">
							<ChevronLeft aria-hidden="true" />
							<span>{back.label}</span>
						</a>
						{back.title != null && <p className="vn-app__title">{back.title}</p>}
					</>
				) : (
					<div className="vn-app__brand">{brand}</div>
				)}
				<div className="vn-app__account">{account}</div>
			</header>
			<main className={dock ? "vn-app__main vn-app__main--dock" : "vn-app__main"}>
				{children}
				{footer != null && <div className="vn-app__footer">{footer}</div>}
			</main>
			{dock}
		</div>
	);
}

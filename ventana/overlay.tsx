/**
 * Lo que flota en Ventana, sobre Radix: `Menu` (acciones de un disparador),
 * `Popover` (un panel con contenido propio) y `Tooltip` (una frase corta). Los
 * tres son paneles de vidrio grueso (`vn-glass vn-glass--thick` en el propio
 * `Content`), montados en un portal dentro de `<div className="vn" style="display:
 * contents">` y crecen desde su disparador (el `transform-origin` lo da Radix).
 *
 * El disparador es el elemento que se pasa (`asChild`): ninguna pieza lo envuelve.
 * Teclado, foco, Escape y lector de pantalla los trae Radix. Todo texto visible
 * llega por props.
 *
 * Materiales: sólo flota el panel. Las filas del menú son sólidas por diseño:
 * pintan su propio resaltado sobre el vidrio y nunca llevan `vn-glass`.
 *
 * `Tooltip` trae su propio `Provider` (400ms de espera, 300ms de ventana para abrir
 * el siguiente sin espera). Cada `Tooltip` tiene el suyo, así que esa ventana sólo
 * se comparte entre tooltips que cuelguen del mismo proveedor de Radix.
 */
import type { ReactElement, ReactNode } from "react";
import { DropdownMenu as M, Popover as P, Tooltip as T } from "radix-ui";

export interface MenuItem {
	key: string;
	label: ReactNode;
	/** Algo antes del texto. */
	icon?: ReactNode;
	/** La palabra apagada al final de la fila («F2», «Pro»). */
	hint?: ReactNode;
	/** Acción destructiva: se pinta en `danger`. */
	danger?: boolean;
	disabled?: boolean;
	onSelect: () => void;
}

export function Menu({
	trigger,
	label,
	items,
	align = "start",
}: {
	trigger: ReactElement;
	/** El nombre accesible del menú (el consumidor lo saca de su diccionario). */
	label: string;
	items: (MenuItem | "separator")[];
	align?: "start" | "end";
}) {
	return (
		<M.Root>
			<M.Trigger asChild>{trigger}</M.Trigger>
			<M.Portal>
				<div className="vn" style={{ display: "contents" }}>
					{/* aria-labelledby se anula: Radix lo apunta al disparador y taparía `label` */}
					<M.Content aria-label={label} aria-labelledby={undefined} side="bottom" align={align} sideOffset={6} collisionPadding={12} className="vn-menu vn-glass vn-glass--thick">
						{items.map((it, i) =>
							it === "separator" ? (
								<M.Separator key={`sep-${i}`} className="vn-menu-sep" />
							) : (
								<M.Item key={it.key} disabled={it.disabled} onSelect={it.onSelect} className={`vn-menu-item${it.danger ? " vn-menu-item--danger" : ""}`}>
									{it.icon && <span className="vn-menu-icon">{it.icon}</span>}
									<span className="vn-menu-label">{it.label}</span>
									{it.hint && <span className="vn-menu-hint">{it.hint}</span>}
								</M.Item>
							),
						)}
					</M.Content>
				</div>
			</M.Portal>
		</M.Root>
	);
}

export function Popover({
	trigger,
	label,
	children,
	side = "bottom",
	align = "center",
}: {
	trigger: ReactElement;
	/** El nombre accesible del panel. */
	label: string;
	children: ReactNode;
	side?: "top" | "bottom";
	align?: "start" | "center" | "end";
}) {
	return (
		<P.Root>
			<P.Trigger asChild>{trigger}</P.Trigger>
			<P.Portal>
				<div className="vn" style={{ display: "contents" }}>
					<P.Content aria-label={label} side={side} align={align} sideOffset={8} collisionPadding={12} className="vn-popover vn-glass vn-glass--thick">
						{children}
					</P.Content>
				</div>
			</P.Portal>
		</P.Root>
	);
}

export function Tooltip({
	label,
	children,
	side = "top",
}: {
	/** La frase corta; Radix la liga al disparador con `aria-describedby`. */
	label: ReactNode;
	children: ReactElement;
	side?: "top" | "bottom" | "left" | "right";
}) {
	return (
		<T.Provider delayDuration={400} skipDelayDuration={300}>
			<T.Root>
				<T.Trigger asChild>{children}</T.Trigger>
				<T.Portal>
					<div className="vn" style={{ display: "contents" }}>
						<T.Content side={side} sideOffset={8} collisionPadding={12} className="vn-tooltip vn-glass vn-glass--thick">
							{label}
						</T.Content>
					</div>
				</T.Portal>
			</T.Root>
		</T.Provider>
	);
}

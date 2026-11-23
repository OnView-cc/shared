/**
 * Chip y StateChip de Ventana. Los textos llegan por props (`children`, `label`,
 * `removeLabel`): la pieza no escribe ninguna cadena visible.
 *
 * Chip: sin `onSelect` es un `<span>`; con él, un `<button aria-pressed>`. Con
 * `onRemove` lleva un aspa que es un `<button>` aparte; si además es seleccionable,
 * el exterior pasa a ser un `<span>` con dos botones hermanos (nunca un botón
 * dentro de otro). `className` va siempre en el elemento exterior. No trunca: el
 * texto largo baja de línea.
 * `tone="solid"` (por defecto) es sólido y nunca lleva `vn-glass`. `tone="glass"`
 * compone `vn-glass vn-glass--thin` (para lo que flota sobre un video) y sólo lo
 * ajusta por variables; lleva texto primario, nunca secundario. `tone="line"` es
 * sólo filete, sin relleno: para ir DENTRO de un vidrio (la caja de la idea, una
 * lámina), donde un chip sólido es una píldora casi negra y uno de vidrio sería
 * un vidrio dentro de otro. Elegido, sube y engrosa el filete; nunca aclara.
 *
 * StateChip: la etiqueta de estado de una toma, con la firma de `StateTag` de
 * `sky/feed.tsx`. Borrador con filete, generando en tinta maciza con su cuenta,
 * lista en vidrio fino y falló en `--vn-danger` con filete.
 */
import type { ReactElement, ReactNode } from "react";
import { X } from "lucide-react";

export type TakeState = "draft" | "generating" | "ready" | "failed";

const join = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

/** Clases por tono; sólo `glass` es vidrio, y lo compone en vez de repetirlo. */
const TONE_CLASS = {
	solid: "vn-chip--solid",
	glass: "vn-chip--glass vn-glass vn-glass--thin",
	line: "vn-chip--line",
} as const;

export function Chip({
	children,
	icon,
	selected = false,
	onSelect,
	onRemove,
	removeLabel,
	tone = "solid",
	className,
}: {
	children: ReactNode;
	icon?: ReactNode;
	selected?: boolean;
	onSelect?: () => void;
	onRemove?: () => void;
	/** Nombre accesible del aspa; obligatorio con `onRemove`. */
	removeLabel?: string;
	tone?: "glass" | "solid" | "line";
	className?: string;
}): ReactElement {
	const selectable = onSelect !== undefined;
	const removable = onRemove !== undefined;
	const surface = join(
		"vn-chip",
		TONE_CLASS[tone],
		selectable && "vn-chip--action",
		removable && "vn-chip--removable",
		selectable && removable && "vn-chip--split",
		selected && "is-selected",
		className,
	);
	const body = (
		<>
			{icon != null && (
				<span className="vn-chip__icon" aria-hidden="true">
					{icon}
				</span>
			)}
			<span className="vn-chip__label">{children}</span>
		</>
	);
	const remove = removable && (
		<button
			type="button"
			className="vn-chip__x vn-press"
			aria-label={removeLabel}
			onClick={(event) => {
				// El aspa no selecciona el chip
				event.stopPropagation();
				onRemove();
			}}
		>
			<X aria-hidden="true" strokeWidth={2.25} />
		</button>
	);

	if (selectable && !removable) {
		return (
			<button type="button" className={join(surface, "vn-press")} aria-pressed={selected} onClick={onSelect}>
				{body}
			</button>
		);
	}
	return (
		<span className={surface}>
			{selectable ? (
				<button type="button" className="vn-chip__main vn-press" aria-pressed={selected} onClick={onSelect}>
					{body}
				</button>
			) : (
				body
			)}
			{remove}
		</span>
	);
}

/** Clases por estado; sólo `ready` es vidrio, y lo compone en vez de repetirlo. */
const STATE_CLASS: Record<TakeState, string> = {
	draft: "vn-state--draft",
	generating: "vn-state--generating",
	ready: "vn-state--ready vn-glass vn-glass--thin",
	failed: "vn-state--failed",
};

export function StateChip({
	state,
	done,
	total,
	label,
	className,
}: {
	state: TakeState;
	done?: number;
	total?: number;
	label: string;
	className?: string;
}): ReactElement {
	const count = state === "generating" && done != null && total != null ? ` ${done}/${total}` : "";
	return <span className={join("vn-state", "vn-num", STATE_CLASS[state], className)}>{`${label}${count}`}</span>;
}

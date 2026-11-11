/**
 * Las piezas del mundo Feed vertical (subproyecto 8, spec §3.5 y §4): el marco
 * de video en su formato, la lámina sin imagen, la etiqueta de estado de una
 * toma, las barras de avance por toma y el botón del riel con su costo.
 *
 * Los textos llegan como props: shared no tiene diccionario, cada app pasa los
 * suyos en en/es/pt. El aspecto vive en `styles/sky.css` (`.sk-frame*`,
 * `.sk-caption`, `.sk-tag*`, `.sk-story`, `.sk-rail-btn`).
 */
import type { CSSProperties, ReactNode } from "react";
import type { IconComponent } from "./page";

export type VideoFormat = "9:16" | "1:1" | "16:9";
export type TakeState = "draft" | "generating" | "ready" | "failed";

const ratioClass = (format: VideoFormat) => `sk-frame-${format.replace(":", "x")}`;

/** Un video de borde a borde dentro de su marco, con el rótulo abajo a la izquierda sobre el scrim. */
export function VideoFrame({
	format,
	children,
	caption,
	className = "",
	dim = false,
	style,
	"aria-label": ariaLabel,
}: {
	format: VideoFormat;
	children?: ReactNode;
	caption?: ReactNode;
	className?: string;
	dim?: boolean;
	style?: CSSProperties;
	"aria-label"?: string;
}) {
	return (
		<div className={`sk-frame ${ratioClass(format)}${dim ? " is-dim" : ""} ${className}`} style={style} role={ariaLabel ? "group" : undefined} aria-label={ariaLabel}>
			{children}
			{caption != null && (
				<div className="sk-scrim sk-caption-wrap">
					<p className="sk-caption">{caption}</p>
				</div>
			)}
		</div>
	);
}

/** La lámina: un marco sin imagen, con franjas de los colores dados (o el piso) y su título. */
export function SheetFrame({ format, title, colors = [], children, className = "" }: { format: VideoFormat; title?: ReactNode; colors?: string[]; children?: ReactNode; className?: string }) {
	return (
		<VideoFrame format={format} className={`sk-sheet-frame ${className}`}>
			{colors.length > 0 && (
				<span className="sk-sheet-stripes" aria-hidden="true">
					{colors.map((c, i) => (
						<i key={i} style={{ background: c }} />
					))}
				</span>
			)}
			{title != null && <p className="sk-sheet-title">{title}</p>}
			{children}
		</VideoFrame>
	);
}

const TAG_CLASS: Record<TakeState, string> = {
	draft: "sk-tag--line",
	generating: "sk-tag--solid",
	ready: "sk-tag--glass sk-over-video",
	failed: "sk-tag--alert",
};

/** La etiqueta de estado (spec §3.5): borrador con borde, generando blanca con su cuenta, lista de vidrio, falla en rojo cálido. */
export function StateTag({ state, done, total, label, className = "" }: { state: TakeState; done?: number; total?: number; label: string; className?: string }) {
	const count = state === "generating" && done != null && total != null ? ` ${done}/${total}` : "";
	return <span className={`sk-tag ${TAG_CLASS[state]} ${className}`}>{`${label}${count}`}</span>;
}

/** Las barras de avance por toma, como en las historias. Decorativas: el estado lo dice el texto. */
export function StoryBars({ count, current, progress = 0, className = "" }: { count: number; current: number; progress?: number; className?: string }) {
	return (
		<div className={`sk-story ${className}`} aria-hidden="true">
			{Array.from({ length: count }, (_, i) => (
				<span key={i} className={i < current ? "is-done" : i === current ? "is-now" : undefined}>
					<i style={i === current ? { transform: `scaleX(${Math.min(1, Math.max(0, progress))})` } : undefined} />
				</span>
			))}
		</div>
	);
}

/** Un glifo del riel de acciones: trazo fino, la etiqueta corta debajo y, si cuesta, su costo. */
export function RailButton({ icon: Icon, label, cost, active = false, onClick }: { icon: IconComponent; label: string; cost?: string; active?: boolean; onClick: () => void }) {
	return (
		<button type="button" className="sk-rail-btn sk-over-video" aria-pressed={active} aria-label={cost ? `${label}, ${cost}` : label} onClick={onClick}>
			<Icon className="sk-rail-icon" strokeWidth={1.5} aria-hidden="true" />
			<span className="sk-rail-label" aria-hidden="true">
				{label}
			</span>
			{cost && (
				<span className="sk-rail-cost sk-num" aria-hidden="true">
					{cost}
				</span>
			)}
		</button>
	);
}

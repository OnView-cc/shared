/**
 * Las piezas del mundo de OnView («Blue Hour»): la marca, el botón como enlace
 * y la flecha. La geometría de la marca vive una sola vez en `mark.ts`.
 */
import { useId } from "react";
import { ArrowRight } from "lucide-react";
import { MARK, MARK_COLORS, type MarkTone } from "./mark";
import { AI_MARK } from "./ai-mark";

/** La marca: el fotograma y el círculo abierto del lápiz graso. `tone="paper"` sobre papel claro. */
export function Mark({ className = "size-6", tone = "night" }: { className?: string; tone?: MarkTone }) {
	const c = MARK_COLORS[tone];
	const { frame: f, grease: g } = MARK;
	return (
		<svg viewBox={MARK.viewBox} className={className} aria-hidden="true">
			<rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} fill="none" stroke={c.frame} strokeWidth={f.width} />
			<path d={g.d} fill="none" stroke={c.grease} strokeWidth={g.width} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

/** Lumen, la IA: la ventana encendida con su cruceta; de noche, un halo tenue. */
export function AiMark({ className = "size-6", tone = "night" }: { className?: string; tone?: MarkTone }) {
	// useId trae caracteres que una referencia url(#…) de SVG no admite.
	const halo = `lumen${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
	const { window: w, mullion: m, sill: s } = AI_MARK;
	const fill = w.fill[tone];
	const cx = w.x + w.w / 2;
	return (
		<svg viewBox={AI_MARK.viewBox} className={className} aria-hidden="true">
			{tone === "night" && (
				<>
					<defs>
						<filter id={halo} x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation={AI_MARK.halo.blur} />
						</filter>
					</defs>
					<rect x={w.x} y={w.y} width={w.w} height={w.h} rx={w.rx} fill={fill} opacity={AI_MARK.halo.opacity} filter={`url(#${halo})`} />
				</>
			)}
			<rect x={w.x} y={w.y} width={w.w} height={w.h} rx={w.rx} fill={fill} />
			<line x1={cx} y1={w.y} x2={cx} y2={w.y + w.h} stroke={m.color[tone]} strokeWidth={m.width} />
			<line x1={w.x} y1={m.crossY} x2={w.x + w.w} y2={m.crossY} stroke={m.color[tone]} strokeWidth={m.width} />
			<path d={`M${w.x - 1} ${s.y}H${w.x + w.w + 1}`} stroke={s.color[tone]} strokeWidth={s.width} strokeLinecap="round" />
		</svg>
	);
}

/** La marca con su nombre: «OnView» en Archivo ancha y firme. Hereda el color de quien la monta. */
export function Wordmark({ href, className = "", tone = "night" }: { href: string; className?: string; tone?: MarkTone }) {
	return (
		<a
			href={href}
			className={`inline-flex items-center gap-2 -ml-1 px-1 py-1 text-[1.125rem] font-[640] tracking-[-0.018em] [font-stretch:112%] no-underline ${tone === "paper" ? "text-(--sk-accent-ink)" : "text-(--sk-ink)"} ${className}`}>
			<Mark tone={tone} />
			OnView
		</a>
	);
}

export function SkArrow({ className = "size-4" }: { className?: string }) {
	return <ArrowRight className={`sk-arrow shrink-0 ${className}`} strokeWidth={1.75} aria-hidden="true" />;
}

/** Una píldora como enlace. `primary` (de tinta; sobre el cielo, invertida) es la única acción primaria de cada vista. */
export function SkButton({
	href,
	children,
	variant = "primary",
	size = "md",
	className = "",
}: {
	href: string;
	children: React.ReactNode;
	variant?: "primary" | "quiet" | "glass";
	size?: "md" | "sm";
	className?: string;
}) {
	return (
		<a href={href} className={`sk-btn sk-btn--${variant} ${size === "sm" ? "sk-btn--sm" : ""} ${className}`}>
			{children}
		</a>
	);
}

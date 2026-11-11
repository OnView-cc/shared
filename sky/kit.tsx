/**
 * Las piezas de marca del mundo de OnView («Feed vertical»): la marca, el
 * símbolo de Lumen, el logotipo, el botón como enlace y la flecha. La
 * geometría vive una sola vez en `mark.ts` y `ai-mark.ts`.
 */
import { ArrowRight } from "lucide-react";
import { MARK, MARK_COLORS, type MarkTone } from "./mark";
import { AI_MARK } from "./ai-mark";
import { useReducedMotion } from "./hooks";

/** La marca: el marco 9:16 con su rótulo. `tone="paper"` sobre papel claro. */
export function Mark({ className = "size-6", tone = "night" }: { className?: string; tone?: MarkTone }) {
	const c = MARK_COLORS[tone];
	const { frame: f, caption: k } = MARK;
	return (
		<svg viewBox={MARK.viewBox} className={className} aria-hidden="true">
			<rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} fill="none" stroke={c} strokeWidth={f.width} />
			<rect x={k.x} y={k.y} width={k.w} height={k.h} rx={k.rx} fill={c} />
		</svg>
	);
}

/** Lumen, la IA: un punto blanco con halo. `thinking`: el halo late mientras piensa (nunca con movimiento reducido). */
export function AiMark({ className = "size-6", tone = "night", thinking = false }: { className?: string; tone?: MarkTone; thinking?: boolean }) {
	const reduced = useReducedMotion();
	const c = MARK_COLORS[tone];
	const { dot, halo } = AI_MARK;
	return (
		<svg viewBox={AI_MARK.viewBox} className={`sk-ai-mark ${thinking && !reduced ? "sk-ai-thinking" : ""} ${className}`} aria-hidden="true">
			<circle className="sk-ai-halo" cx={12} cy={12} r={halo.r} fill="none" stroke={c} strokeWidth={halo.width} opacity={halo.opacity} />
			<circle cx={12} cy={12} r={dot.r} fill={c} />
		</svg>
	);
}

/** La marca con su nombre: «OnView» en Bricolage gruesa. Hereda el color de quien la monta. */
export function Wordmark({ href, className = "", tone = "night" }: { href: string; className?: string; tone?: MarkTone }) {
	return (
		<a href={href} className={`sk-wordmark ${tone === "paper" ? "text-(--sk-accent-ink)" : "text-(--sk-ink)"} ${className}`}>
			<Mark tone={tone} />
			OnView
		</a>
	);
}

export function SkArrow({ className = "size-4" }: { className?: string }) {
	return <ArrowRight className={`sk-arrow shrink-0 ${className}`} strokeWidth={1.75} aria-hidden="true" />;
}

/** Una píldora como enlace. `primary` (blanca, con texto negro) es la acción principal de cada vista; `quiet` lleva borde. */
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

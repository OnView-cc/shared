/**
 * Las piezas de marca del mundo Ventana: la marca de OnView («Dos capas»), el
 * símbolo de Iris («El prisma») y el logotipo. La geometría vive una sola vez en
 * `mark.ts` y `ai-mark.ts`; el CSS del símbolo de Iris, en `content.css`.
 *
 * Misma firma que `sky/kit.tsx` salvo: `Mark` y `AiMark` ya no traen un tamaño
 * por defecto en `className` (sin clase de tamaño, el CSS les da 1.5rem), y
 * `AiMark` tiene versión plana (`mono`).
 */
import { MARK, MARK_COLORS, type MarkTone } from "./mark";
import { AI_MARK, spectrumGradient } from "./ai-mark";
import { useReducedMotion } from "../sky/hooks";

/** La marca: dos marcos 9:16 superpuestos. `tone="paper"` sobre papel claro. */
export function Mark({ className, tone = "night" }: { className?: string; tone?: MarkTone }) {
	const c = MARK_COLORS[tone];
	const { back: b, front: f } = MARK;
	return (
		<svg viewBox={MARK.viewBox} className={className ?? "vn-mark"} aria-hidden="true">
			<rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx} fill={c} opacity={b.opacity} />
			<rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} fill={c} />
		</svg>
	);
}

const SPECTRUM = { "--vn-ai-spectrum": spectrumGradient() } as React.CSSProperties;

/**
 * Iris, la IA: un núcleo con un aro de espectro. `thinking`: el aro gira (3 s,
 * lineal) mientras piensa, nunca con movimiento reducido. `mono` (un solo color,
 * sin degradado): el punto con un aro tenue, para lo que no puede llevar color.
 * El tamaño sale de `className` (sin clase, 1.5rem en el CSS).
 */
export function AiMark({
	className = "",
	tone = "night",
	thinking = false,
	mono = false,
}: {
	className?: string;
	tone?: MarkTone;
	thinking?: boolean;
	mono?: boolean;
}) {
	const reduced = useReducedMotion();
	if (mono) {
		const c = MARK_COLORS[tone];
		const { core, ring } = AI_MARK;
		return (
			<svg viewBox={AI_MARK.viewBox} className={className || "vn-ai-mono"} aria-hidden="true">
				<circle cx={12} cy={12} r={(ring.inner + ring.outer) / 2} fill="none" stroke={c} strokeWidth={ring.outer - ring.inner} opacity={0.4} />
				<circle cx={12} cy={12} r={core.r} fill={c} />
			</svg>
		);
	}
	const cls = ["vn-ai", tone === "paper" ? "vn-ai--paper" : "", thinking && !reduced ? "vn-ai--thinking" : "", className].filter(Boolean).join(" ");
	return (
		<span className={cls} style={SPECTRUM} aria-hidden="true">
			<span className="vn-ai__ring" />
			<span className="vn-ai__core" />
		</span>
	);
}

/** La marca con su nombre: «OnView» en 650, tracking −0.02em. Hereda la fuente de `.vn`. */
export function Wordmark({ href, className = "", tone = "night" }: { href: string; className?: string; tone?: MarkTone }) {
	return (
		<a href={href} className={["vn-wordmark", tone === "paper" ? "vn-wordmark--paper" : "", className].filter(Boolean).join(" ")}>
			<Mark tone={tone} />
			OnView
		</a>
	);
}


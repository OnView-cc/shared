/**
 * La auditoría de un cuadro (spec 2026-11-24-onview-escenas-con-codigo §8.2):
 * medida en la página con el DOM, sobre la capa de un momento, en el segundo en
 * que está el motor. Lo que encuentra va al modelo que revisa la escena junto
 * con el cuadro grabado.
 *
 * - `text_overflow`: un texto que desborda su caja o se sale del cuadro.
 * - `text_overlap`: dos textos que se pisan (más del 10 % del menor).
 * - `out_of_safe_area`: un texto fuera del área segura del formato (en 9:16,
 *   la interfaz de TikTok, Reels y Shorts tapa los bordes).
 * - `image_missing`: una imagen visible que no cargó.
 * - `empty_frame`: nada visible de tamaño (más del 2 % del cuadro).
 * - `empty_tail`: la escena deja de moverse más de 1 s antes de acabar.
 *
 * Sólo cuenta lo visible: opacidad efectiva (la del elemento por la de sus
 * padres hasta la capa) de más de 0.5, y sin `visibility: hidden`.
 */
import type { Format } from "../video/compose";

export type AuditCode = "text_overflow" | "text_overlap" | "out_of_safe_area" | "image_missing" | "empty_frame" | "empty_tail";

export interface AuditIssue {
	code: AuditCode;
	moment: number;
	detail: string;
}

/** El área segura, en fracción del cuadro, por lado. */
export function safeArea(format: Format): { top: number; right: number; bottom: number; left: number } {
	if (format === "9:16") return { top: 0.1, right: 0.12, bottom: 0.2, left: 0.06 };
	return { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 };
}

type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };

const TOL = 1;
const VISIBLE = 0.5;
const EMPTY_TAIL = 1;

function opacityOf(el: Element, stop: Element): number {
	let o = 1;
	for (let n: Element | null = el; n && n !== stop.parentElement; n = n.parentElement) {
		const cs = n.ownerDocument.defaultView?.getComputedStyle(n);
		if (!cs) continue;
		if (cs.visibility === "hidden" || cs.display === "none") return 0;
		const v = parseFloat(cs.opacity);
		if (Number.isFinite(v)) o *= v;
	}
	return o;
}

const ownText = (el: Element) => [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0);

const area = (b: Box) => Math.max(0, b.width) * Math.max(0, b.height);
const cross = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

export function auditFrame(stage: HTMLElement, moment: number, format: Format, opts: { tailGap?: number } = {}): AuditIssue[] {
	const layer = stage.querySelector<HTMLElement>(`.motion-layer[data-moment="${moment}"]`);
	if (!layer) return [];
	const s = stage.getBoundingClientRect();
	const rel = (el: Element): Box => {
		const r = el.getBoundingClientRect();
		return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top, width: r.width, height: r.height };
	};
	const W = s.width;
	const H = s.height;
	const safe = safeArea(format);
	const issues: AuditIssue[] = [];
	const add = (code: AuditCode, detail: string) => issues.push({ code, moment, detail });
	const label = (el: Element) => JSON.stringify((el.textContent ?? "").trim().slice(0, 40));

	const all = [...layer.querySelectorAll<HTMLElement>("*")];
	const visible = all.filter((el) => opacityOf(el, layer) > VISIBLE);
	const texts = visible.filter(ownText).map((el) => ({ el, box: rel(el) }));

	for (const { el, box } of texts) {
		const cw = el.clientWidth;
		const ch = el.clientHeight;
		const spills = (cw > 0 && el.scrollWidth > cw + TOL) || (ch > 0 && el.scrollHeight > ch + TOL);
		const outside = box.left < -TOL || box.top < -TOL || box.right > W + TOL || box.bottom > H + TOL;
		if (spills || outside) add("text_overflow", `${label(el)} ${outside ? "leaves the frame" : "does not fit its box"}`);
		else if (box.left < safe.left * W - TOL || box.right > (1 - safe.right) * W + TOL || box.top < safe.top * H - TOL || box.bottom > (1 - safe.bottom) * H + TOL) add("out_of_safe_area", `${label(el)} is outside the safe area`);
	}
	for (let i = 0; i < texts.length; i++) {
		for (let j = i + 1; j < texts.length; j++) {
			const a = texts[i]!;
			const b = texts[j]!;
			if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
			const smaller = Math.min(area(a.box), area(b.box));
			if (smaller > 0 && cross(a.box, b.box) > 0.1 * smaller) add("text_overlap", `${label(a.el)} overlaps ${label(b.el)}`);
		}
	}
	for (const img of visible.filter((el): el is HTMLImageElement => el.tagName === "IMG")) {
		if (img.complete && img.naturalWidth === 0) add("image_missing", `image ${img.getAttribute("src") ?? ""} did not load`);
	}
	const big = visible.some((el) => area(rel(el)) > 0.02 * W * H);
	if (!big) add("empty_frame", "nothing visible of any size in this frame");
	if (opts.tailGap != null && opts.tailGap > EMPTY_TAIL) add("empty_tail", `nothing moves for the last ${opts.tailGap.toFixed(1)} s`);
	return issues;
}

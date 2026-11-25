/**
 * La letra de la caja (spec 2026-11-24 §6.3): `KineticText`, la frase que
 * entra palabra a palabra (o letra a letra, o línea a línea) con desenfoque,
 * subida o máscara, con una palabra de acento en el color de la marca y un
 * tachado opcional; y `Counter`, un número que cuenta.
 *
 * El tamaño por defecto sale del estilo (`SCALE`); con las letras cargadas, si
 * la frase no cabe en su ancho, encoge hasta 4 u (`shrinkToFit`).
 */
import { gsap } from "gsap";
import { shrinkToFit } from "../layout";
import type { SceneCtx } from "../scene/context";
import { applyTypeStyle, phraseWeight, SCALE } from "../type";
import { AFTER, documented, norm, piece, within } from "./base";

export interface KineticTextOptions {
	text: string;
	accent?: string;
	by?: "word" | "letter" | "line";
	enter?: "blur" | "rise" | "mask";
	at: number;
	/** En golpes; por defecto 0.5 (0.08 letra a letra). */
	stagger?: number;
	/** En `u`; por defecto, el del estilo. */
	size?: number;
	align?: "left" | "center";
	/** Una palabra que se tacha después de entrar todo. */
	strike?: string;
	x?: number;
	y?: number;
	/** El ancho máximo en `u`; por defecto, el 84 % del cuadro. */
	width?: number;
}

const MIN_U = 4;

function kineticText(ctx: SceneCtx, o: KineticTextOptions): { el: HTMLElement; exit(opts: { at: number; to?: "blur" | "up" | "fade" }): void } {
	const doc = ctx.el.ownerDocument;
	const { u, tl } = ctx;
	const type = ctx.style.type;
	const by = o.by ?? "word";
	const enter = o.enter ?? "blur";
	const size = o.size ?? (ctx.orientation === "portrait" ? 8.5 : 7.5) * SCALE[type.scale];
	const maxW = (o.width ?? (ctx.width / u) * 0.84) * u;
	const box = piece(ctx, "kit-text", { x: o.x, y: o.y });
	Object.assign(box.style, {
		fontSize: `${size * u}px`,
		fontFamily: ctx.font(ctx.doc.brand.face.family),
		fontWeight: String(phraseWeight(type, ctx.doc.brand.face)),
		color: ctx.ink,
		textAlign: o.align ?? "center",
		maxWidth: `${maxW}px`,
		width: "max-content",
		lineHeight: "1.08",
		whiteSpace: "normal",
	});
	applyTypeStyle(box, type);
	const accent = o.accent ? norm(o.accent) : null;
	const strike = o.strike ? norm(o.strike) : null;

	// Las unidades que entran: palabras (en su línea), letras o líneas enteras.
	const units: HTMLElement[] = [];
	const words: HTMLElement[] = [];
	const lines = o.text.split("\n").map((l) => l.trim()).filter(Boolean);
	lines.forEach((line, li) => {
		if (li > 0) box.appendChild(doc.createElement("br"));
		const lineEl = doc.createElement("span");
		lineEl.className = "kit-line";
		box.appendChild(lineEl);
		if (by === "line") units.push(lineEl);
		line.split(/\s+/).forEach((w, wi) => {
			if (wi > 0) lineEl.appendChild(doc.createTextNode(" "));
			const word = doc.createElement("span");
			word.className = "kit-word";
			Object.assign(word.style, { display: "inline-block", position: "relative", color: accent && norm(w) === accent ? ctx.doc.brand.accent : ctx.ink });
			if (by === "letter") {
				for (const ch of w) {
					const letter = doc.createElement("span");
					letter.className = "kit-letter";
					letter.textContent = ch;
					letter.style.display = "inline-block";
					word.appendChild(letter);
					units.push(letter);
				}
			} else word.textContent = w;
			if (by === "word") units.push(word);
			words.push(word);
			lineEl.appendChild(word);
		});
	});

	const step = (o.stagger ?? (by === "letter" ? 0.08 : 0.5)) * ctx.beatSeconds;
	const startOf = (i: number) => within(ctx, o.at + i * step);
	// Cuándo aparece cada palabra: la de su primera unidad.
	const wordStart = (w: HTMLElement) => {
		const i = units.findIndex((x) => x === w || w.contains(x) || x.contains(w));
		return startOf(Math.max(0, i));
	};

	units.forEach((unit, i) => {
		const at = startOf(i);
		if (enter === "rise") {
			unit.style.clipPath = "inset(-20% -5% -5% -5%)";
			gsap.set(unit, { opacity: 0, yPercent: 100 });
			tl.fromTo(unit, { opacity: 0, yPercent: 100 }, { opacity: 1, yPercent: 0, duration: 0.55, ease: "expo.out", ...AFTER }, at);
		} else if (enter === "mask") {
			gsap.set(unit, { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" });
			tl.fromTo(unit, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.out", ...AFTER }, at);
		} else {
			gsap.set(unit, { opacity: 0, y: 1.2 * u, filter: "blur(12px)" });
			tl.fromTo(unit, { opacity: 0, y: 1.2 * u, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out", ...AFTER }, at);
		}
	});

	for (const w of words) {
		if (accent && norm(w.textContent ?? "") === accent) ctx.event("reveal", wordStart(w));
	}

	if (strike) {
		const last = startOf(units.length - 1) + ctx.beatSeconds;
		for (const w of words) {
			if (norm(w.textContent ?? "") !== strike) continue;
			const bar = doc.createElement("span");
			bar.className = "kit-strike";
			Object.assign(bar.style, { position: "absolute", left: "-4%", right: "-4%", top: "54%", height: "0.08em", background: "currentColor", transformOrigin: "left center" });
			w.appendChild(bar);
			gsap.set(bar, { scaleX: 0 });
			tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.inOut", ...AFTER }, within(ctx, last));
		}
	}

	ctx.onReady(() => void shrinkToFit(box, [box, ...words], maxW, MIN_U * u));

	gsap.set(box, { opacity: 1 });
	return {
		el: box,
		exit({ at, to = "blur" }) {
			const t = within(ctx, at);
			if (to === "up") tl.fromTo(box, { opacity: 1, y: 0 }, { opacity: 0, y: -3 * u, duration: 0.45, ease: "power2.in", ...AFTER }, t);
			else if (to === "fade") tl.fromTo(box, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "sine.inOut", ...AFTER }, t);
			else tl.fromTo(box, { opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(14px)", duration: 0.45, ease: "power2.in", ...AFTER }, t);
		},
	};
}

export const KineticText = documented(kineticText, {
	name: "KineticText",
	signature: "kit.KineticText(ctx, { text, accent?, by?, enter?, at, stagger?, size?, align?, strike?, x?, y?, width? }) → { el, exit({ at, to? }) }",
	options:
		"text: the words (use ctx.text(key)); '\\n' breaks a line. accent: one word drawn in the brand accent colour (emits 'reveal'). by: 'word' (default) | 'letter' | 'line'. enter: 'blur' (default) | 'rise' | 'mask'. at: absolute second (ctx.beat(n) or a ctx.cues time). stagger: beats between units (0.5; 0.08 for letters). size: font size in u (default from the style). align: 'center' | 'left'. strike: a word struck through one beat after the last unit. x, y: centre in u (default: frame centre). width: max width in u (default 84 % of the frame). exit.to: 'blur' | 'up' | 'fade'. Shrinks itself to fit.",
	example: 'const t = kit.KineticText(ctx, { text: ctx.text("headline"), accent: ctx.text("accent"), at: ctx.beat(0) });\nt.exit({ at: ctx.beat(6) });',
});

export interface CounterOptions {
	from: number;
	to: number;
	at: number;
	/** En golpes. */
	duration: number;
	format?: "int" | "money" | "percent";
	prefix?: string;
	suffix?: string;
	x?: number;
	y?: number;
	size?: number;
}

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function counter(ctx: SceneCtx, o: CounterOptions): { el: HTMLElement } {
	const el = piece(ctx, "kit-counter", { x: o.x, y: o.y });
	Object.assign(el.style, { fontSize: `${(o.size ?? 10) * ctx.u}px`, fontFamily: ctx.font(ctx.doc.brand.face.family), fontWeight: "700", color: ctx.ink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" });
	const show = (v: number) => {
		const n = Math.round(v);
		const body = o.format === "money" ? MONEY.format(n) : o.format === "percent" ? `${n}%` : INT.format(n);
		el.textContent = `${o.prefix ?? ""}${body}${o.suffix ?? ""}`;
	};
	show(o.from);
	const proxy = { v: o.from };
	ctx.tl.fromTo(
		proxy,
		{ v: o.from },
		{ v: o.to, duration: o.duration * ctx.beatSeconds, ease: "power2.out", ...AFTER, onUpdate: () => show(proxy.v), onReverseComplete: () => show(o.from) },
		within(ctx, o.at),
	);
	return { el };
}

export const Counter = documented(counter, {
	name: "Counter",
	signature: "kit.Counter(ctx, { from, to, at, duration, format?, prefix?, suffix?, x?, y?, size? }) → { el }",
	options: "A number that counts from 'from' to 'to'. duration in beats. format: 'int' (default, 1,200) | 'money' ($1,200) | 'percent' (45%). Only show numbers that are in brand.knowledge or the script.",
	example: 'kit.Counter(ctx, { from: 0, to: 20000, at: ctx.beat(1), duration: 2, suffix: " mAh" });',
});

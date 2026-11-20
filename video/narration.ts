/**
 * La narración continua de un video (spec 2026-11-20-onview-narracion-continua):
 * las líneas de sus momentos grabadas en una sola toma. Este módulo, puro, hace
 * de la toma y de sus palabras con tiempo (las de la transcripción) los
 * **tramos**: lo que suena en cada momento.
 *
 * - `alignNarration` casa las palabras del guion con las transcritas (una
 *   alineación por programación dinámica sobre palabras normalizadas, así una
 *   palabra mal oída no descoloca las demás). Una línea que no se encuentra se
 *   reparte por caracteres entre sus vecinas; sin palabras, todo se reparte así.
 * - Cada tramo va desde un poco antes de su primera palabra (`LEAD`, el corte cae
 *   en la respiración) hasta donde empieza el siguiente: los tramos cubren la toma
 *   entera sin huecos, y tocados en orden suenan como la toma.
 * - `momentWords` da las palabras de un tramo relativas a su inicio: lo que el
 *   motor usa para que la imagen entre con la palabra (`motion/cues.ts`).
 */

/** Una línea del guion: lo que dice el narrador sobre un momento. */
export interface NarrationLine {
	shotId: string;
	text: string;
}

/** Una palabra de la transcripción, con sus segundos en la toma. */
export interface TimedWord {
	word: string;
	start: number;
	end: number;
}

/** Lo que suena en un momento: `from`–`to` de la toma; lo hablado, dentro; y sus palabras (en segundos de la toma). */
export interface NarrationSlice {
	shotId: string;
	from: number;
	to: number;
	spokenFrom: number;
	spokenTo: number;
	words: TimedWord[];
}

export interface NarrationTiming {
	slices: NarrationSlice[];
	/** False si no hubo palabras con tiempo y todo se repartió por caracteres. */
	aligned: boolean;
}

/** Cuánto antes de la primera palabra de una línea empieza su tramo. */
export const LEAD = 0.12;

/** Una palabra para comparar: minúsculas, sin acentos ni signos («OnDesk.cc» → «ondeskcc»). */
export function normalizeWord(w: string): string {
	return w
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]/gu, "");
}

export function tokens(text: string): string[] {
	return text
		.split(/\s+/)
		.map(normalizeWord)
		.filter(Boolean);
}

/** El índice de la transcripción que casa con cada palabra del guion (o -1), por la subsecuencia común más larga. */
function align(script: string[], heard: string[]): number[] {
	const n = script.length;
	const m = heard.length;
	const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--)
		for (let j = m - 1; j >= 0; j--) dp[i]![j] = script[i] === heard[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
	const out = new Array<number>(n).fill(-1);
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (script[i] === heard[j]) {
			out[i] = j;
			i++;
			j++;
		} else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
		else j++;
	}
	return out;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export function alignNarration(lines: NarrationLine[], words: TimedWord[], duration: number): NarrationTiming {
	const total = Math.max(0, duration);
	if (lines.length === 0) return { slices: [], aligned: false };
	const heard = words.map((w) => normalizeWord(w.word));
	const script: { tok: string; line: number }[] = lines.flatMap((l, line) => tokens(l.text).map((tok) => ({ tok, line })));
	const match = heard.length ? align(script.map((s) => s.tok), heard) : script.map(() => -1);

	// Lo hablado de cada línea según sus palabras casadas.
	const spans: ({ from: number; to: number; first: number; last: number } | null)[] = lines.map((_, line) => {
		const idx = script.flatMap((s, k) => (s.line === line && match[k]! >= 0 ? [match[k]!] : []));
		if (!idx.length) return null;
		const first = Math.min(...idx);
		const last = Math.max(...idx);
		return { from: words[first]!.start, to: words[last]!.end, first, last };
	});
	const aligned = spans.some(Boolean);

	// Las líneas sin casar: repartidas por caracteres entre lo conocido de sus vecinas.
	const chars = lines.map((l) => Math.max(1, l.text.trim().length));
	for (let i = 0; i < lines.length; ) {
		if (spans[i]) {
			i++;
			continue;
		}
		let j = i;
		while (j < lines.length && !spans[j]) j++;
		const start = i > 0 ? spans[i - 1]!.to : 0;
		// Hasta la respiración de la siguiente línea conocida (su corte cae ahí).
		const end = j < lines.length ? Math.max(start, spans[j]!.from - LEAD) : total;
		const sum = chars.slice(i, j).reduce((a, b) => a + b, 0);
		let at = start;
		for (let k = i; k < j; k++) {
			const len = (Math.max(0, end - start) * chars[k]!) / sum;
			spans[k] = { from: at, to: at + len, first: -1, last: -1 };
			at += len;
		}
		i = j;
	}

	// Los cortes: un poco antes de la primera palabra de cada línea, nunca antes del final de la anterior.
	const cuts: number[] = [0];
	for (let i = 1; i < lines.length; i++) {
		const prevEnd = spans[i - 1]!.to;
		const start = spans[i]!.from;
		cuts.push(Math.max(cuts[i - 1]!, prevEnd > start ? start : Math.max(prevEnd, start - LEAD)));
	}
	cuts.push(Math.max(cuts.at(-1)!, total));

	const slices = lines.map((l, i) => {
		const s = spans[i]!;
		const from = cuts[i]!;
		const to = cuts[i + 1]!;
		const own = s.first >= 0 ? words.slice(s.first, s.last + 1) : [];
		return {
			shotId: l.shotId,
			from: round(from),
			to: round(to),
			spokenFrom: round(Math.min(Math.max(s.from, from), to)),
			spokenTo: round(Math.min(Math.max(s.to, from), to)),
			words: own.map((w) => ({ word: w.word, start: round(w.start), end: round(w.end) })),
		};
	});
	return { slices, aligned };
}

/** Una palabra relativa al inicio de su momento. */
export interface MomentWord {
	w: string;
	at: number;
	end: number;
}

/** Las palabras de un tramo y lo hablado, en segundos desde el inicio del tramo (el del momento). */
export function momentWords(slice: Pick<NarrationSlice, "from" | "spokenFrom" | "spokenTo" | "words">): { words: MomentWord[]; spoken: { from: number; to: number } } {
	return {
		words: slice.words.map((w) => ({ w: w.word, at: round(Math.max(0, w.start - slice.from)), end: round(Math.max(0, w.end - slice.from)) })),
		spoken: { from: round(Math.max(0, slice.spokenFrom - slice.from)), to: round(Math.max(0, slice.spokenTo - slice.from)) },
	};
}

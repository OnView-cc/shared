/**
 * La imagen entra con la palabra (spec 2026-11-20-onview-narracion-continua §2.2).
 * Un momento con narración trae sus palabras con su segundo (`Moment.words`,
 * desde el inicio del momento) y lo hablado (`Moment.spoken`). `cueTimes`
 * devuelve, para cada texto que el bloque va a enseñar en orden (los grupos de
 * un `text`, las filas de una lista), el segundo en que la voz lo dice: la
 * primera palabra con contenido del texto que suena después de la anterior.
 * Lo que la voz no dice se reparte entre lo que sí, a lo largo de lo hablado.
 * Sin palabras, null: el bloque sigue en golpes.
 */
import { normalizeWord, tokens, type MomentWord } from "../video/narration";

/** Palabras que no sirven para encontrar un texto en la voz (en, es, pt). */
const STOP = new Set(
	"a an and are as at be by for from in into is it its of on or our so that the their this to we with you your y o el la los las un una unos unas de del al en con por para que es su sus tu tus mi mis e um uma uns umas do da dos das no na nos nas com pelo pela seu sua seus suas".split(" "),
);

const content = (text: string) => tokens(text).filter((t) => t.length >= 3 && !STOP.has(t));

export function cueTimes(texts: string[], words: MomentWord[] | undefined, spoken: { from: number; to: number } | undefined): number[] | null {
	if (!words?.length || !spoken || texts.length === 0) return null;
	const heard = words.map((w) => normalizeWord(w.w));
	const found: (number | null)[] = [];
	let cursor = 0;
	for (const text of texts) {
		const wanted = new Set(content(text));
		let hit = -1;
		for (let i = cursor; i < heard.length && wanted.size; i++)
			if (wanted.has(heard[i]!)) {
				hit = i;
				break;
			}
		if (hit >= 0) {
			found.push(words[hit]!.at);
			cursor = hit + 1;
		} else found.push(null);
	}
	// Lo no dicho, repartido entre sus vecinos dichos (o los bordes de lo hablado).
	const out = [...found];
	for (let i = 0; i < out.length; ) {
		if (out[i] !== null) {
			i++;
			continue;
		}
		let j = i;
		while (j < out.length && out[j] === null) j++;
		const a = i > 0 ? out[i - 1]! : spoken.from;
		const b = j < out.length ? out[j]! : spoken.to;
		// Sin vecino delante, el primero va al empezar a hablar; los demás se reparten hasta el siguiente.
		const steps = j - i + (i > 0 ? 1 : 0);
		for (let k = i; k < j; k++) out[k] = i > 0 ? a + ((b - a) * (k - i + 1)) / steps : a + ((b - a) * (k - i)) / Math.max(1, steps);
		i = j;
	}
	// Nunca hacia atrás.
	for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i]!, out[i - 1]!);
	return out as number[];
}

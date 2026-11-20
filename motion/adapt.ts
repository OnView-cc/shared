/**
 * Arma el video de un template con el material que hay y la duración pedida
 * (spec 2026-11-18-onview-todo-codigo §B6). Función pura: misma entrada, misma
 * salida; no sabe de la base ni del modelo, sólo del tipo de cada imagen.
 *
 * En este orden:
 *
 * 1. **Material por tipo**, en el orden recibido; cada pieza se usa una vez
 *    (salvo al reutilizar en el paso 5c, y en un momento `consumes.shared`, que
 *    enseña las mismas piezas que ya enseñó otro: la lista tras la ráfaga).
 * 2. **Instancias:** un momento con `repeat` aparece una vez por pieza (o por
 *    cada `consumes.min` piezas) hasta `repeat.max`, y al menos `repeat.min`
 *    veces; los momentos con el mismo `repeat.group` se repiten juntos. Un
 *    momento con `consumes` y sin `repeat` toma entre `min` y `max` piezas.
 * 3. **Sin material:** `onMissing` decide: `"text"` → una frase con los mismos
 *    golpes (`fallback`); `"drop"` → se quita. Por defecto, `"drop"` si el
 *    momento es opcional y `"text"` si no.
 * 4. **Recortar** mientras pase de lo pedido o del plan (el plan se mide con el
 *    margen de tempo `FIT_HEADROOM`; lo pedido, con el tempo tal cual): primero
 *    las repeticiones desde el final, luego los opcionales desde el final.
 * 5. **Crecer** mientras falte más de un golpe para lo pedido, sin pasar del
 *    plan: (a) alargar las frases 2 golpes cada una, por turnos, hasta 8;
 *    (b) añadir una frase tras cada momento ampliable, como mucho 3 en total;
 *    (c) repetir una demo o una foto con la misma imagen (la foto con otro
 *    movimiento de cámara), como mucho 2, sólo en los momentos de imagen que el
 *    template marca `expandable`. Si no queda qué hacer, el video sale más
 *    corto: Lumen lo dice.
 * 6. El cierre `logo` final no cuenta en ninguna medida.
 *
 * Las claves: la primera vez, la del template; las siguientes (repeticiones y
 * añadidos), `clave#n` con n desde 2, sin repetirse nunca.
 */
import { beatSeconds, countedBeats, FIT_HEADROOM } from "./fit";
import type { AnyBlockParams, BlockKind, MaterialItem, MaterialKind, Template, TemplateMoment, Transition } from "./types";

export interface AdaptOptions {
	bpm: number;
	targetSeconds: number;
	maxSeconds: number;
}

export interface PlannedMoment {
	key: string;
	templateKey: string;
	block: BlockKind;
	beats: number;
	/** La fijada en el template; null = la del estilo (spec 2026-11-19). */
	transition: Transition | null;
	imageIds: string[];
	fallback: boolean;
	expanded: boolean;
	params: Partial<AnyBlockParams>;
	write: string;
	slots: TemplateMoment["slots"];
}

/** Lo que dura lo que cuenta (sin el `logo` final) a un tempo. */
export function plannedSeconds(ms: Pick<PlannedMoment, "block" | "beats">[], bpm: number): number {
	return countedBeats(ms) * beatSeconds(bpm);
}

const EPS = 1e-6;
const MAX_TEXT_BEATS = 8;
const MAX_EXPANDED_TEXT = 3;
const MAX_REUSED = 2;
const MOVES = ["out", "pan"] as const;

/** Un momento armado, con lo que hace falta para recortar: de qué unidad e instancia sale. */
type Item = PlannedMoment & { unit: number; instance: number; optional: boolean };

const missing = (m: TemplateMoment): "text" | "drop" => m.onMissing ?? (m.optional ? "drop" : "text");

export function adaptTemplate(t: Template, material: MaterialItem[], o: AdaptOptions): PlannedMoment[] {
	// 1. El material por tipo.
	const all = new Map<MaterialKind, string[]>();
	for (const item of material) all.set(item.kind, [...(all.get(item.kind) ?? []), item.id]);
	const pool = new Map([...all].map(([k, ids]) => [k, [...ids]]));
	// Lo que ya enseñó algún momento, por tipo: lo que repite un momento `shared`.
	const shown = new Map<MaterialKind, string[]>();
	const take = (kind: MaterialKind, n: number): string[] => {
		const ids = (pool.get(kind) ?? []).splice(0, n);
		shown.set(kind, [...(shown.get(kind) ?? []), ...ids]);
		return ids;
	};
	const has = (kind: MaterialKind) => (pool.get(kind) ?? []).length;

	// Las unidades: un momento suelto o un grupo de momentos vecinos con el mismo `repeat.group`.
	const units: TemplateMoment[][] = [];
	for (const m of t.moments) {
		const prev = units.at(-1);
		const group = m.repeat?.group;
		if (group && prev && prev[0]!.repeat?.group === group) prev.push(m);
		else units.push([m]);
	}

	// 2 y 3. Las instancias de cada unidad.
	const used = new Map<string, number>();
	const keyFor = (base: string) => {
		const n = (used.get(base) ?? 0) + 1;
		used.set(base, n);
		return n === 1 ? base : `${base}#${n}`;
	};
	const items: Item[] = [];
	units.forEach((unit, u) => {
		const repeat = unit[0]!.repeat;
		const consuming = unit.filter((m) => m.consumes && !m.consumes.shared);
		// Cuántas instancias tienen todo su material.
		let complete = 0;
		if (repeat) {
			const counts = consuming.map((m) => Math.floor(has(m.consumes!.kind) / m.consumes!.min));
			complete = Math.min(repeat.max, consuming.length ? Math.min(...counts) : repeat.max);
		}
		const instances = repeat ? Math.max(repeat.min, complete) : 1;
		for (let i = 0; i < instances; i++) {
			for (const m of unit) {
				let imageIds: string[] = [];
				let ok = true;
				if (m.consumes?.shared) {
					const { kind, min, max } = m.consumes;
					const seen = (shown.get(kind) ?? []).slice(0, max);
					if (seen.length >= Math.max(1, min)) imageIds = seen;
					else ok = false;
				} else if (m.consumes) {
					const { kind, min, max } = m.consumes;
					const n = repeat ? min : Math.min(max, has(kind));
					if ((!repeat || i < complete) && has(kind) >= Math.max(1, min) && n >= min) imageIds = take(kind, n);
					else ok = false;
				}
				const base = { templateKey: m.key, transition: m.transition ?? null, write: m.write, slots: m.slots, unit: u, instance: i, optional: m.optional, expanded: false, params: {} };
				if (ok) {
					items.push({ ...base, key: keyFor(m.key), block: m.block, beats: m.beats, imageIds, fallback: false });
				} else if (missing(m) === "text") {
					items.push({ ...base, key: keyFor(m.key), block: "text", beats: m.beats, imageIds: [], fallback: true, slots: { lines: { max: 2, wordsPerLine: 4 } } });
				}
			}
		}
	});

	// 4. Recortar.
	const target = o.targetSeconds;
	const overPlan = (ms: Item[]) => plannedSeconds(ms, o.bpm * FIT_HEADROOM) > o.maxSeconds + EPS;
	const over = (ms: Item[]) => overPlan(ms) || plannedSeconds(ms, o.bpm) > target + EPS;
	const isClosing = (ms: Item[], m: Item) => m === ms.at(-1) && m.block === "logo";
	while (over(items)) {
		const lastRepeat = [...items].reverse().find((m) => m.instance > 0);
		if (lastRepeat) {
			for (let i = items.length - 1; i >= 0; i--) if (items[i]!.unit === lastRepeat.unit && items[i]!.instance === lastRepeat.instance) items.splice(i, 1);
			continue;
		}
		const lastOptional = [...items].reverse().find((m) => m.optional && !isClosing(items, m));
		if (!lastOptional) break;
		items.splice(items.indexOf(lastOptional), 1);
	}

	// 5. Crecer.
	const beat = beatSeconds(o.bpm);
	const short = () => target - plannedSeconds(items, o.bpm) > beat + EPS;
	const fits = (ms: Item[]) => !over(ms);
	// (a) Alargar frases.
	for (let grew = true; grew && short(); ) {
		grew = false;
		for (const m of items) {
			if (!short()) break;
			if (m.block !== "text" || m.beats >= MAX_TEXT_BEATS) continue;
			m.beats += 2;
			if (fits(items)) grew = true;
			else m.beats -= 2;
		}
	}
	// (b) Frases añadidas tras los momentos ampliables.
	const expandable = new Set(t.moments.filter((m) => m.expandable).map((m) => m.key));
	let added = 0;
	for (let grew = true; grew && short() && added < MAX_EXPANDED_TEXT; ) {
		grew = false;
		for (const source of items.filter((m) => m.block === "text" && !m.fallback && expandable.has(m.templateKey) && !m.expanded)) {
			if (!short() || added >= MAX_EXPANDED_TEXT) break;
			const extra: Item = { ...source, key: keyFor(source.templateKey), block: "text", beats: 4, imageIds: [], fallback: false, expanded: true, params: {}, instance: 0, optional: true };
			const at = items.map((m) => m.templateKey).lastIndexOf(source.templateKey) + 1;
			items.splice(at, 0, extra);
			if (fits(items)) {
				added++;
				grew = true;
			} else {
				items.splice(at, 1);
				used.set(source.templateKey, (used.get(source.templateKey) ?? 1) - 1);
			}
		}
	}
	// (c) Reutilizar una demo o una foto: sólo los momentos de imagen que el template marca ampliables
	// (repetir un producto del catálogo o un paso de «Cómo se usa» no tiene sentido).
	let reused = 0;
	for (const source of items.filter((m) => (m.block === "ui" || m.block === "product") && m.imageIds.length && !m.expanded && expandable.has(m.templateKey))) {
		if (!short() || reused >= MAX_REUSED) break;
		const params = source.block === "product" ? { move: MOVES[reused % MOVES.length] } : {};
		const extra: Item = { ...source, key: keyFor(source.templateKey), expanded: true, params, instance: 0, optional: true };
		const at = items.map((m) => m.templateKey).lastIndexOf(source.templateKey) + 1;
		items.splice(at, 0, extra);
		if (fits(items)) reused++;
		else {
			items.splice(at, 1);
			used.set(source.templateKey, (used.get(source.templateKey) ?? 1) - 1);
		}
	}

	return items.map(({ unit: _u, instance: _i, optional: _o, ...m }) => m);
}

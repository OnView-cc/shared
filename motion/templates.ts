/**
 * Los templates curados (spec 2026-11-18 §6). En este paso viven en código:
 * sólo hay uno, «Lanzamiento de software»; la tabla de templates llega cuando
 * cada equipo pueda crear los suyos (paso 5).
 *
 * «Lanzamiento de software» sigue al video de Arcade que el usuario dio como
 * referencia: sin voz (sólo música y texto), una frase que entra golpe a golpe,
 * la marca que suelta los iconos de sus productos, una lista que pasa, una
 * demostración de la interfaz, el beneficio y el cierre. La lista y la demo son
 * opcionales: se quitan para caber en los 15 s del plan Free.
 */
import type { Template } from "./types";

const SOFTWARE_LAUNCH: Template = {
	id: "software-launch",
	kinds: ["platform"],
	defaultBpm: 116,
	voice: false,
	background: "sky",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			transition: "blur",
			optional: false,
			slots: { lines: { max: 3, wordsPerLine: 3 } },
			sample: {
				en: { lines: ["Six apps", "that already", "know each other."] },
				es: { lines: ["Seis apps", "que ya se", "conocen."] },
				pt: { lines: ["Seis apps", "que já se", "conhecem."] },
			},
		},
		{ key: "products", block: "icons", beats: 8, transition: "push", optional: false, slots: { images: { min: 2, max: 6 } }, sample: { en: { variant: "burst" }, es: { variant: "burst" }, pt: { variant: "burst" } } },
		{ key: "list", block: "icons", beats: 12, transition: "blur", optional: true, slots: { images: { min: 2, max: 6 } }, sample: { en: { variant: "list" }, es: { variant: "list" }, pt: { variant: "list" } } },
		{ key: "demo", block: "ui", beats: 8, transition: "blur", optional: true, slots: { images: { min: 1, max: 2 } }, sample: {} },
		{
			key: "benefit",
			block: "text",
			beats: 4,
			transition: "blur",
			optional: false,
			slots: { lines: { max: 3, wordsPerLine: 4 } },
			sample: {
				en: { lines: ["Apps that behave", "like one product."] },
				es: { lines: ["Apps que se comportan", "como un solo producto."] },
				pt: { lines: ["Aplicativos que se comportam", "como um só produto."] },
			},
		},
		{ key: "close", block: "logo", beats: 4, transition: "cut", optional: false, slots: {}, sample: {} },
	],
};

export const TEMPLATES: Record<string, Template> = { [SOFTWARE_LAUNCH.id]: SOFTWARE_LAUNCH };

export function getTemplate(id: string): Template | null {
	return Object.hasOwn(TEMPLATES, id) ? TEMPLATES[id]! : null;
}

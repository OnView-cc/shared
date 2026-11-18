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
 *
 * Los textos los escribe Lumen con lo que sabe de la marca y lo que la persona
 * cuenta (`write` le dice qué va en cada momento, en inglés porque es una
 * instrucción para el modelo). Las muestras (`sample`) son guías genéricas, sólo
 * para cuando el template se crea sin Lumen: nunca el texto de una marca.
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
			write: "The hook: one short sentence split into 2 or 3 groups of at most 3 words, each group comes in on its own beat. Say what the product is or the change it brings, in the brand's tone. No brand name here (the closing has it).",
			sample: {
				en: { lines: ["Your product", "in one", "short line."] },
				es: { lines: ["Tu producto", "en una", "frase corta."] },
				pt: { lines: ["Seu produto", "numa", "frase curta."] },
			},
		},
		{
			key: "products",
			block: "icons",
			beats: 8,
			transition: "push",
			optional: false,
			slots: { images: { min: 2, max: 6 } },
			write: "The brand's logo in the middle lets out the icons of its products or features. No words: the person uploads 2 to 6 icons to this scene's Images.",
			sample: { en: { variant: "burst" }, es: { variant: "burst" }, pt: { variant: "burst" } },
		},
		{
			key: "list",
			block: "icons",
			beats: 12,
			transition: "blur",
			optional: true,
			slots: { images: { min: 2, max: 6 } },
			write: "The same icons as a list that passes one by one. Each icon gets a short name (at most 2 words) once the person has uploaded them.",
			sample: { en: { variant: "list" }, es: { variant: "list" }, pt: { variant: "list" } },
		},
		{
			key: "demo",
			block: "ui",
			beats: 8,
			transition: "blur",
			optional: true,
			slots: { images: { min: 1, max: 2 } },
			write: "A real screenshot of the product, with the cursor clicking its main action. No words: the person uploads the screenshot and marks the click.",
			sample: {},
		},
		{
			key: "benefit",
			block: "text",
			beats: 4,
			transition: "blur",
			optional: false,
			slots: { lines: { max: 3, wordsPerLine: 4 } },
			write: "The benefit: what the person who uses it gains, in 1 or 2 groups of at most 4 words. Only facts from the brand's knowledge or what the person said.",
			sample: {
				en: { lines: ["What people gain", "by using it."] },
				es: { lines: ["Lo que gana", "quien lo usa."] },
				pt: { lines: ["O que ganha", "quem usa."] },
			},
		},
		{
			key: "close",
			block: "logo",
			beats: 4,
			transition: "cut",
			optional: false,
			slots: {},
			write: "The closing with the brand's logo and one short line: the website, a call to action or the brand's slogan (at most 6 words).",
			sample: {},
		},
	],
};

export const TEMPLATES: Record<string, Template> = { [SOFTWARE_LAUNCH.id]: SOFTWARE_LAUNCH };

export function getTemplate(id: string): Template | null {
	return Object.hasOwn(TEMPLATES, id) ? TEMPLATES[id]! : null;
}

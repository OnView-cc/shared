/**
 * Los templates curados (spec 2026-11-18-onview-todo-codigo §A4 y §B6). Viven
 * en código; la tabla de templates llega cuando cada equipo pueda crear los
 * suyos. Esta es la biblioteca de la entrega 1: los ocho que se arman con los
 * bloques de hoy (`text`, `icons`, `ui`, `product`, `logo`).
 *
 * Cada template dice qué material pide y cómo se adapta (`consumes`, `repeat`,
 * `onMissing`, `expandable`); `adaptTemplate` (`adapt.ts`) lo arma con el
 * material y la duración de cada video. La voz no es del template: es del video.
 *
 * Cómo se ve y se mueve es de su **estilo** (`style`, `styles.ts`; spec
 * 2026-11-19-onview-estilos-y-referencias): el tempo, el fondo, la letra y la
 * transición entre momentos. Un momento sólo fija su transición a propósito
 * (el `push` de la ráfaga de Arcade y el `cut` del cierre).
 *
 * Los textos los escribe Lumen con lo que sabe de la marca y lo que la persona
 * cuenta (`write` le dice qué va en cada momento, en inglés porque es una
 * instrucción para el modelo; `when`, cuándo elegirlo). Las muestras (`sample`)
 * son guías genéricas, sólo para cuando el template se aplica sin Lumen: nunca
 * el texto de una marca.
 *
 * «Lanzamiento de software» sigue al video de Arcade que el usuario dio como
 * referencia: una frase que entra golpe a golpe, la marca que suelta los iconos
 * de sus productos, una lista que pasa, una demostración de la interfaz, el
 * beneficio y el cierre.
 */
import type { Template } from "./types";

const LOGOS = { kind: "logo", min: 2, max: 6 } as const;
const SCREENSHOT = { kind: "screenshot", min: 1, max: 1 } as const;
const PHOTO = { kind: "product_photo", min: 1, max: 1 } as const;
const close = (write: string): Template["moments"][number] => ({ key: "close", block: "logo", beats: 4, transition: "cut", optional: false, slots: {}, write, sample: {} });
const CLOSE_LINE = "The closing with the brand's logo and one short line: the website, a call to action or the brand's slogan (at most 6 words).";

const SOFTWARE_LAUNCH: Template = {
	id: "software-launch",
	name: { en: "Software launch", es: "Lanzamiento de software", pt: "Lançamento de software" },
	description: {
		en: "Your app or platform: what it is, its products and a real screen.",
		es: "Tu app o plataforma: qué es, sus productos y una pantalla real.",
		pt: "Seu app ou plataforma: o que é, seus produtos e uma tela real.",
	},
	when: "A launch or presentation of an app, a platform or a piece of software. Uses the kit's brands as icons and screenshots of the product when there are any.",
	materials: [
		{ kind: "screenshot", required: false },
		{ kind: "logo", required: false },
	],
	kinds: ["platform"],
	style: "arcade",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
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
			consumes: LOGOS,
			onMissing: "drop",
			slots: { images: { min: 2, max: 6 } },
			write: "The brand's logo in the middle lets out the icons of its products or features. No words. The icons (2 to 6) are the logos of the kit's brands or images the person attaches.",
			sample: { en: { variant: "burst" }, es: { variant: "burst" }, pt: { variant: "burst" } },
		},
		{
			key: "list",
			block: "icons",
			beats: 12,
			optional: true,
			consumes: { ...LOGOS, shared: true },
			slots: { images: { min: 2, max: 6 } },
			write: "The same icons as a list that passes one by one. Each icon gets a short name (at most 2 words): the brand's name for a kit logo.",
			sample: { en: { variant: "list" }, es: { variant: "list" }, pt: { variant: "list" } },
		},
		{
			key: "demo",
			block: "ui",
			beats: 8,
			optional: true,
			consumes: SCREENSHOT,
			repeat: { min: 1, max: 3 },
			onMissing: "drop",
			slots: { images: { min: 1, max: 1 } },
			write: "A real screenshot of the product, with the cursor clicking its main action. No words. Look at the screenshot and set the zoom on the part that matters and the click on the action.",
			sample: {},
		},
		{
			key: "benefit",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
			slots: { lines: { max: 3, wordsPerLine: 4 } },
			write: "The benefit: what the person who uses it gains, in 1 or 2 groups of at most 4 words. Only facts from the brand's knowledge or what the person said.",
			sample: {
				en: { lines: ["What people gain", "by using it."] },
				es: { lines: ["Lo que gana", "quien lo usa."] },
				pt: { lines: ["O que ganha", "quem usa."] },
			},
		},
		close(CLOSE_LINE),
	],
};

const NEWS: Template = {
	id: "news",
	name: { en: "What's new", es: "Novedades", pt: "Novidades" },
	description: {
		en: "The changes of an update, each one with its screen.",
		es: "Los cambios de una versión, cada uno con su pantalla.",
		pt: "As mudanças de uma versão, cada uma com sua tela.",
	},
	when: "An update, a release, a changelog or new features of a software product. One screenshot per change when there are any; without screenshots, the changes are said in words.",
	materials: [{ kind: "screenshot", required: false }],
	kinds: ["platform"],
	style: "changelog",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			optional: false,
			slots: { lines: { max: 2, wordsPerLine: 3 } },
			write: "Announce the update in 1 or 2 groups of at most 3 words: what is new, the version or the month, as the person said it.",
			sample: {
				en: { lines: ["What's new", "this month."] },
				es: { lines: ["Lo nuevo", "de este mes."] },
				pt: { lines: ["O que há", "de novo."] },
			},
		},
		{
			key: "change",
			block: "text",
			beats: 4,
			optional: false,
			repeat: { min: 2, max: 4, group: "change" },
			slots: { lines: { max: 2, wordsPerLine: 4 } },
			write: "One change of this update, in 1 or 2 groups of at most 4 words. Each repeat (change#2, change#3…) is a different change, in the order the person gave them. Only changes the person named.",
			sample: {
				en: { lines: ["A new feature", "in one line."] },
				es: { lines: ["Una función nueva", "en una línea."] },
				pt: { lines: ["Uma função nova", "numa linha."] },
			},
		},
		{
			key: "change_shot",
			block: "ui",
			beats: 8,
			optional: false,
			consumes: SCREENSHOT,
			repeat: { min: 2, max: 4, group: "change" },
			onMissing: "drop",
			slots: { images: { min: 1, max: 1 } },
			write: "The screenshot of the change just named. No words. Set the zoom on the part that changed and the click on it.",
			sample: {},
		},
		close("The closing with the brand's logo and one short line: where to try it or the version (at most 6 words)."),
	],
};

const INTEGRATIONS: Template = {
	id: "integrations",
	name: { en: "Integrations", es: "Integraciones", pt: "Integrações" },
	description: {
		en: "The apps it connects with fly around your logo.",
		es: "Las apps con las que se conecta vuelan alrededor de tu logo.",
		pt: "Os apps com que se conecta voam ao redor do seu logo.",
	},
	when: "A product that connects with other apps or tools: integrations, a marketplace, connectors. Needs the logos of those apps (attached) or the kit's brands.",
	materials: [{ kind: "logo", required: true }],
	kinds: ["platform"],
	style: "orbit",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			optional: false,
			slots: { lines: { max: 3, wordsPerLine: 3 } },
			write: "The hook in 2 or 3 groups of at most 3 words: that it works with the tools the audience already uses.",
			sample: {
				en: { lines: ["Works with", "the tools", "you use."] },
				es: { lines: ["Funciona con", "las herramientas", "que ya usas."] },
				pt: { lines: ["Funciona com", "as ferramentas", "que você usa."] },
			},
		},
		{
			key: "burst",
			block: "icons",
			beats: 8,
			optional: false,
			consumes: LOGOS,
			slots: { images: { min: 2, max: 6 } },
			write: "The brand's logo in the middle and the logos of the apps it connects with flying around it. No words.",
			sample: { en: { variant: "burst" }, es: { variant: "burst" }, pt: { variant: "burst" } },
		},
		{
			key: "list",
			block: "icons",
			beats: 12,
			optional: true,
			consumes: { ...LOGOS, shared: true },
			slots: { images: { min: 2, max: 6 } },
			write: "The same apps as a list, each with its name (at most 2 words).",
			sample: { en: { variant: "list" }, es: { variant: "list" }, pt: { variant: "list" } },
		},
		{
			key: "benefit",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
			slots: { lines: { max: 3, wordsPerLine: 4 } },
			write: "What connecting them changes for the person, in 1 or 2 groups of at most 4 words. Only facts from the brand's knowledge or what the person said.",
			sample: {
				en: { lines: ["Everything in sync,", "nothing to copy."] },
				es: { lines: ["Todo sincronizado,", "nada que copiar."] },
				pt: { lines: ["Tudo sincronizado,", "nada para copiar."] },
			},
		},
		close(CLOSE_LINE),
	],
};

const PRODUCT: Template = {
	id: "product",
	name: { en: "Product", es: "Producto", pt: "Produto" },
	description: {
		en: "Your product's photos with a slow camera and phrases on the beat.",
		es: "Las fotos de tu producto con cámara lenta y frases al ritmo.",
		pt: "As fotos do seu produto com câmera lenta e frases no ritmo.",
	},
	when: "A launch or presentation of one physical product. Needs at least one photo of the product; up to three photos, one moment each.",
	materials: [{ kind: "product_photo", required: true }],
	kinds: ["product"],
	style: "showcase",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
			slots: { lines: { max: 3, wordsPerLine: 3 } },
			write: "The hook in 2 or 3 groups of at most 3 words: what the product is or why it matters, in the brand's tone.",
			sample: {
				en: { lines: ["Meet", "the new", "one."] },
				es: { lines: ["Conoce", "el nuevo", "modelo."] },
				pt: { lines: ["Conheça", "o novo", "modelo."] },
			},
		},
		{
			key: "shot",
			block: "product",
			beats: 8,
			optional: false,
			expandable: true,
			consumes: PHOTO,
			repeat: { min: 1, max: 3 },
			slots: { lines: { max: 2, wordsPerLine: 4 }, images: { min: 1, max: 1 } },
			write: "One feature of the product next to its photo, in 1 or 2 groups of at most 4 words. Each repeat (shot#2, shot#3) says a different feature, matching what its photo shows. Never a feature you cannot see or that is not in the brand's knowledge.",
			sample: {
				en: { lines: ["Made to last.", "Built to use."] },
				es: { lines: ["Hecho para durar.", "Pensado para usar."] },
				pt: { lines: ["Feito para durar.", "Pensado para usar."] },
			},
		},
		{
			key: "benefit",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
			slots: { lines: { max: 3, wordsPerLine: 4 } },
			write: "Why buy it, in 1 or 2 groups of at most 4 words. Only facts from the brand's knowledge or what the person said.",
			sample: {
				en: { lines: ["Yours", "from today."] },
				es: { lines: ["Tuyo", "desde hoy."] },
				pt: { lines: ["Seu", "a partir de hoje."] },
			},
		},
		close(CLOSE_LINE),
	],
};

const CATALOG: Template = {
	id: "catalog",
	name: { en: "Catalog", es: "Catálogo", pt: "Catálogo" },
	description: {
		en: "Several products, one by one, with their name and price.",
		es: "Varios productos, uno a uno, con nombre y precio.",
		pt: "Vários produtos, um a um, com nome e preço.",
	},
	when: "Several products of a shop or a range, one by one with name and price. Needs at least 2 product photos (up to 6).",
	materials: [{ kind: "product_photo", required: true }],
	kinds: ["product"],
	style: "blocks",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			optional: false,
			slots: { lines: { max: 2, wordsPerLine: 3 } },
			write: "The hook in 1 or 2 groups of at most 3 words: the collection, the season or the shop.",
			sample: {
				en: { lines: ["The new", "collection."] },
				es: { lines: ["La nueva", "colección."] },
				pt: { lines: ["A nova", "coleção."] },
			},
		},
		{
			key: "item",
			block: "product",
			beats: 6,
			optional: false,
			consumes: PHOTO,
			repeat: { min: 2, max: 6 },
			slots: { lines: { max: 2, wordsPerLine: 4 }, images: { min: 1, max: 1 } },
			write: "This product's name as the first line and its price as the second, exactly as the person gave them. Each repeat (item#2…) is the next product. If the person gave no price, only the name.",
			sample: {
				en: { lines: ["Product name", "$00"] },
				es: { lines: ["Nombre del producto", "00 €"] },
				pt: { lines: ["Nome do produto", "R$ 00"] },
			},
		},
		close("The closing with the brand's logo and one short line: where to buy (the website or the shop) in at most 6 words."),
	],
};

const HOW_TO: Template = {
	id: "how-to",
	name: { en: "How to use it", es: "Cómo se usa", pt: "Como usar" },
	description: {
		en: "Three or four numbered photos, step by step.",
		es: "Tres o cuatro fotos numeradas, paso a paso.",
		pt: "Três ou quatro fotos numeradas, passo a passo.",
	},
	when: "How to use, assemble or prepare a physical product, step by step. Needs one photo per step (3 or 4).",
	materials: [{ kind: "product_photo", required: true }],
	kinds: ["product"],
	style: "steps",
	moments: [
		{
			key: "hook",
			block: "text",
			beats: 4,
			optional: false,
			slots: { lines: { max: 2, wordsPerLine: 3 } },
			write: "The hook in 1 or 2 groups of at most 3 words: what the steps achieve.",
			sample: {
				en: { lines: ["Ready", "in four steps."] },
				es: { lines: ["Listo", "en cuatro pasos."] },
				pt: { lines: ["Pronto", "em quatro passos."] },
			},
		},
		{
			key: "step",
			block: "product",
			beats: 6,
			optional: false,
			consumes: PHOTO,
			repeat: { min: 3, max: 4 },
			slots: { lines: { max: 2, wordsPerLine: 4 }, images: { min: 1, max: 1 } },
			write: "The step number as the first line (1, 2, 3…) and the instruction as the second, at most 4 words, matching what its photo shows. Each repeat (step#2…) is the next step.",
			sample: {
				en: { lines: ["1", "Open the box."] },
				es: { lines: ["1", "Abre la caja."] },
				pt: { lines: ["1", "Abra a caixa."] },
			},
		},
		close(CLOSE_LINE),
	],
};

const OFFER: Template = {
	id: "offer",
	name: { en: "Offer", es: "Oferta", pt: "Oferta" },
	description: {
		en: "The deal in big type, the product and the deadline.",
		es: "La oferta en grande, el producto y la fecha límite.",
		pt: "A oferta em destaque, o produto e o prazo.",
	},
	when: "A discount, a sale, a price or a limited-time offer. Uses one product photo if there is one; without it, only words.",
	materials: [{ kind: "product_photo", required: false }],
	kinds: ["product"],
	style: "impact",
	moments: [
		{
			key: "deal",
			block: "text",
			beats: 4,
			optional: false,
			slots: { lines: { max: 2, wordsPerLine: 3 } },
			write: "The deal in big type, in 1 or 2 groups of at most 3 words: the discount or the price, exactly as the person gave it. Never invent a number.",
			sample: {
				en: { lines: ["30% off", "everything."] },
				es: { lines: ["30 % menos", "en todo."] },
				pt: { lines: ["30% off", "em tudo."] },
			},
		},
		{
			key: "shot",
			block: "product",
			beats: 8,
			optional: false,
			consumes: PHOTO,
			slots: { lines: { max: 2, wordsPerLine: 4 }, images: { min: 1, max: 1 } },
			write: "The product next to its photo: its name and, if the person gave it, the price after the deal.",
			sample: {
				en: { lines: ["Product name", "now $00"] },
				es: { lines: ["Nombre del producto", "ahora 00 €"] },
				pt: { lines: ["Nome do produto", "agora R$ 00"] },
			},
		},
		{
			key: "deadline",
			block: "text",
			beats: 4,
			optional: false,
			slots: { lines: { max: 2, wordsPerLine: 3 } },
			write: "When the offer ends, in 1 or 2 groups of at most 3 words, exactly as the person said. If they gave no date, a short urgency line without a date.",
			sample: {
				en: { lines: ["Only", "this week."] },
				es: { lines: ["Sólo", "esta semana."] },
				pt: { lines: ["Só", "esta semana."] },
			},
		},
		close("The closing with the brand's logo and a call to action: where to buy, in at most 6 words."),
	],
};

const BRAND_STORY: Template = {
	id: "brand-story",
	name: { en: "Brand story", es: "Historia de marca", pt: "História da marca" },
	description: {
		en: "Phrases about who you are, and your logo at the end.",
		es: "Frases sobre quién eres, y tu logo al final.",
		pt: "Frases sobre quem você é, e seu logo no final.",
	},
	when: "Anything else: who the brand is, its values, an announcement without product images. The fallback when no other template fits; needs only the brand kit.",
	materials: [],
	kinds: ["other"],
	style: "cinema",
	moments: [
		{
			key: "line",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
			slots: { lines: { max: 3, wordsPerLine: 3 } },
			write: "The first phrase of the story, in 2 or 3 groups of at most 3 words: who the brand is for or what it believes. From the brand's knowledge and tone.",
			sample: {
				en: { lines: ["Made for", "people who", "build."] },
				es: { lines: ["Hecho para", "quien", "construye."] },
				pt: { lines: ["Feito para", "quem", "constrói."] },
			},
		},
		{
			key: "line2",
			block: "text",
			beats: 4,
			optional: false,
			expandable: true,
			slots: { lines: { max: 3, wordsPerLine: 3 } },
			write: "The second phrase: what the brand does differently, in 2 or 3 groups of at most 3 words. Only facts from the brand's knowledge.",
			sample: {
				en: { lines: ["Simple", "by design."] },
				es: { lines: ["Simple", "por diseño."] },
				pt: { lines: ["Simples", "por design."] },
			},
		},
		{
			key: "line3",
			block: "text",
			beats: 4,
			optional: true,
			slots: { lines: { max: 3, wordsPerLine: 3 } },
			write: "The third phrase: the promise, in 1 or 2 groups of at most 3 words.",
			sample: {
				en: { lines: ["Here", "to stay."] },
				es: { lines: ["Aquí", "para quedarse."] },
				pt: { lines: ["Aqui", "para ficar."] },
			},
		},
		{
			key: "marks",
			block: "icons",
			beats: 8,
			optional: true,
			consumes: LOGOS,
			slots: { images: { min: 2, max: 6 } },
			write: "The brand's logo in the middle with the logos of its other brands or products around it. No words.",
			sample: { en: { variant: "burst" }, es: { variant: "burst" }, pt: { variant: "burst" } },
		},
		close(CLOSE_LINE),
	],
};

/** Los ids en el orden de la galería. */
export const TEMPLATE_IDS = ["software-launch", "news", "integrations", "product", "catalog", "how-to", "offer", "brand-story"] as const;

export const TEMPLATES: Record<string, Template> = Object.fromEntries(
	[SOFTWARE_LAUNCH, NEWS, INTEGRATIONS, PRODUCT, CATALOG, HOW_TO, OFFER, BRAND_STORY].map((t) => [t.id, t]),
);

export function getTemplate(id: string): Template | null {
	return Object.hasOwn(TEMPLATES, id) ? TEMPLATES[id]! : null;
}

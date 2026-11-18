/**
 * La galería del motor (sólo desarrollo, no se publica en ninguna app): pinta
 * un video de ejemplo con todos los bloques, en el formato y el idioma de la
 * URL, para mirarlo en el navegador o hacerle capturas.
 *
 *   npx esbuild motion/dev/gallery.ts --bundle --outfile=motion/dev/gallery.js
 *   y abrir motion/dev/gallery.html?format=9:16&lang=pt&worst=1
 *
 * `worst=1` usa los peores casos (frases largas, una sola imagen muy ancha…).
 * Expone `window.__motion` (`seek`, `duration`, `ready`) como la página del
 * Container, así el mismo script de capturas sirve para las dos. Los iconos son
 * cuadrados de color dibujados aquí: este repo es público y no lleva marcas de
 * nadie.
 */
import { composeVideo, type ComposeShot, type Format } from "../../video/compose";
import { parseBlockParams, type BlockKind, type Transition } from "../types";
import { createMotion } from "../index";

const q = new URLSearchParams(location.search);
const format = (q.get("format") ?? "16:9") as Format;
const worst = q.get("worst") === "1";
const lang = (q.get("lang") ?? "es") as "en" | "es" | "pt";

const COLORS = ["#0b8fa3", "#168a63", "#d3622b", "#3e5dda", "#804ed2", "#51972e"];
const icon = (i: number, w = 256, h = 256) => {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="${Math.min(w, h) * 0.23}" fill="${COLORS[i % 6]}"/><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.22}" fill="none" stroke="#fff" stroke-width="${Math.min(w, h) * 0.06}"/></svg>`;
	return { id: `i${i}`, src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width: w, height: h };
};
const screenshot = (w: number, h: number) => {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="18" fill="#fff"/><rect x="40" y="40" width="${w * 0.3}" height="28" rx="6" fill="#16181d"/><rect x="${w - 200}" y="34" width="150" height="40" rx="20" fill="#16181d"/>${[0, 1, 2, 3].map((r) => `<circle cx="70" cy="${130 + r * 70}" r="20" fill="#dfe3ea"/><rect x="110" y="${118 + r * 70}" width="${w * 0.35}" height="22" rx="5" fill="#c9ced8"/>`).join("")}</svg>`;
	return { id: `s${w}x${h}`, src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width: w, height: h };
};

const LINES: Record<typeof lang, { hook: string[]; benefit: string[]; long: string[] }> = {
	en: { hook: ["Six apps", "that already", "know each other."], benefit: ["Apps that behave", "like one product."], long: ["Applications that behave like a single product", "for every team."] },
	es: { hook: ["Seis apps", "que ya se", "conocen."], benefit: ["Apps que se comportan", "como un solo producto."], long: ["Aplicaciones que se comportan como un solo producto", "para todo el equipo."] },
	pt: { hook: ["Seis apps", "que já se", "conhecem."], benefit: ["Aplicativos que se comportam", "como um só produto."], long: ["Aplicativos que se comportam como um só produto", "para toda a equipe."] },
};
const L = LINES[lang];
const icons = (worst ? [0, 1] : [0, 1, 2, 3, 4, 5]).map((i) => icon(i));
const labels = Object.fromEntries(icons.map((im, i) => [im.id, ["Soporte", "Contraseñas", "Proyectos", "Chat", "Reuniones", "Archivos"][i]!]));

let position = 0;
const moment = (block: BlockKind, beats: number, transition: Transition, params: Record<string, unknown>, images: ComposeShot["images"] = []): ComposeShot => ({
	id: `m${position}`,
	position: position++,
	seconds: 2,
	block,
	params: parseBlockParams(block, params),
	beats,
	transition,
	trimIn: 0,
	trimOut: null,
	clip: null,
	still: null,
	voice: null,
	images,
});

const shots: ComposeShot[] = [
	moment("text", 4, "blur", { lines: worst ? L.long : L.hook }),
	moment("icons", 8, "push", { variant: "burst", labels }, icons),
	moment("icons", 12, "blur", { variant: "list", labels }, icons),
	moment("ui", 8, "blur", { zoom: { x: 0.3, y: 0.35, scale: 1.3 }, click: { x: 0.86, y: 0.08 } }, [worst ? screenshot(4000, 600) : screenshot(1200, 800)]),
	moment("product", 6, "blur", { lines: worst ? L.long : ["Taza térmica", "12 h caliente."] }, [icon(2, 900, 900)]),
	moment("text", 4, "blur", { lines: L.benefit }),
];

const logo = icon(3, 400, 400).src;
const doc = composeVideo({
	format,
	quality: "standard_1080p",
	voiceVolume: 1,
	musicVolume: 0.35,
	musicFadeIn: 0,
	musicFadeOut: 1.5,
	closingLine: worst ? "Empieza hoy con todo tu equipo en un mismo sitio" : "onview.cc",
	tempo: { bpm: 116, offset: 0 },
	template: { id: "software-launch", voice: false },
	shots,
	music: null,
	sfx: [],
	brand: { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: ["#ffffff", "#0b1f44", "#f1844d", "#3e5dda"], primary: { family: "inter", weight: 500 }, secondary: { family: "inter", weight: 500 }, sceneLogo: logo, closingLogo: logo },
	limits: { maxResolution: "1080p", watermark: q.get("watermark") === "1" },
});

const root = document.getElementById("root")!;
root.style.width = `${doc.width}px`;
root.style.height = `${doc.height}px`;
const motion = createMotion(root, { ...doc, media: { watermark: null } }, { mode: "export" });
(window as unknown as { __motion: unknown }).__motion = motion;
if (!navigator.webdriver) {
	const t0 = performance.now();
	const tick = () => {
		void motion.seek(((performance.now() - t0) / 1000) % motion.duration);
		requestAnimationFrame(tick);
	};
	void motion.ready.then(tick);
}

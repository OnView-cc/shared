/**
 * La piel del mundo Feed vertical sobre la consola y las páginas: las clases
 * que usan las vistas vivas existen en `styles/sky.css`; los colores salen de
 * los tokens (`--sk-*`) y no van escritos a mano fuera de sus sitios; las
 * esquinas salen de la escala por papel; dentro de la app, el mismo negro que
 * fuera; y los componentes de `sky/` y `ui/` no traen nada del mundo heredado.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const sky = read("styles/sky.css");
const site = read("styles/site.css");
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Bloques de primer nivel (con su selector), aplanando los `@media`. */
function rules(css: string): { sel: string; body: string }[] {
	const out: { sel: string; body: string }[] = [];
	const text = strip(css);
	let i = 0;
	while (i < text.length) {
		const open = text.indexOf("{", i);
		if (open < 0) break;
		const sel = text.slice(i, open).trim();
		let depth = 1;
		let j = open + 1;
		while (depth && j < text.length) {
			if (text[j] === "{") depth++;
			else if (text[j] === "}") depth--;
			j++;
		}
		const body = text.slice(open + 1, j - 1);
		if (/^@(media|supports)/.test(sel)) out.push(...rules(body));
		else out.push({ sel, body });
		i = j;
	}
	return out;
}

const LIVE = [
	"sk-card", "sk-btn", "sk-btn--primary", "sk-btn--quiet", "sk-field", "sk-label", "sk-help", "sk-alert--error", "sk-alert--info",
	"sk-table", "sk-sidebar", "sk-sidelink", "sk-segment", "sk-onpage", "sk-menu", "sk-navlink", "sk-prose", "sk-faq",
	"ticket", "ticket--solid", "ticket--danger", "stamp", "stamp--live", "stamp--alert", "fare", "field", "menu-panel",
	"sheet-dialog", "skeleton", "page-rail", "calling-at", "line-stops", "ring",
	"sk-edge", "sk-num", "sk-over-video", "sk-scrim",
];

/** Donde un color escrito a mano es el sitio correcto: los tokens, el suelo del documento, la cabecera, los fotogramas clave. */
const LITERAL_OK = /^\.sk$|^\.site\.sk$|^\.sk-page$|sk-header|^@keyframes|^(from|to|\d+%)$/;

describe("Feed vertical skin", () => {
	it.each(LIVE)("styles the live class .%s", (cls) => {
		expect(sky).toMatch(new RegExp(`\\.${cls.replace(/-/g, "\\-")}(?![\\w-])`));
	});

	it("writes no solid colour by hand outside the tokens", () => {
		const offenders = rules(sky)
			.filter((r) => !LITERAL_OK.test(r.sel))
			.filter((r) => /#[0-9a-f]{3,8}\b/i.test(r.body))
			.map((r) => r.sel);
		expect(offenders).toEqual([]);
	});

	it("B: every corner comes from the role scale", () => {
		const radii = [...strip(sky).matchAll(/border-radius:\s*([^;!]+)/g), ...strip(site).matchAll(/border-radius:\s*([^;!]+)/g)].map((m) => m[1].trim());
		const ok = ["var(--sk-radius)", "var(--sk-radius-frame)", "var(--sk-radius-panel)", "var(--sk-radius-card)", "var(--sk-radius-field)", "var(--sk-radius-thumb)", "var(--sk-radius-pill)", "0", "50%", "1px"];
		expect(radii.filter((r) => !ok.includes(r))).toEqual([]);
		// B: lo que antes era la esquina única de 2px ahora se nombra por su papel.
		expect(radii.filter((r) => r !== "var(--sk-radius)" && r.startsWith("var(")).length).toBeGreaterThan(10);
	});

	it("B: no hard 2px corner is left in the shared components", () => {
		for (const dir of ["sky", "ui"]) {
			for (const f of readdirSync(new URL(`../${dir}/`, import.meta.url)).filter((f) => f.endsWith(".tsx") && !f.includes(".test."))) {
				expect(read(`${dir}/${f}`), `${dir}/${f}`).not.toMatch(/rounded-\[2px\]|"--border-radius":\s*"2px"/);
			}
		}
	});

	it("the shared components carry nothing of the inherited world", () => {
		const files = [...readdirSync(new URL("../sky/", import.meta.url)).filter((f) => f.endsWith(".tsx") && !f.includes(".test.")).map((f) => `sky/${f}`), "ui/sonner.tsx"];
		for (const file of files) {
			const src = read(file);
			expect(src, file).not.toMatch(/rounded-full|rounded-\[(?:[3-9]|\d{2,})px\]|rgba\(18,\s?17,\s?42|text-white|Airglow|Geist|violet/);
		}
	});
});

describe("the inside ground", () => {
	// Feed vertical: dentro de la app (consolas, cuenta, admin) el mismo negro que fuera; ni azul ni soporte de película aparte.
	const inside = sky.match(/\n\.site\.sk \{([\s\S]*?)\n\}/)?.[1] ?? "";
	it("the app sits on the same ground as the site", () => {
		expect(inside).toMatch(/background: var\(--sk-ground\)/);
	});
	it.each(["ground", "mist", "surface", "haze", "film", "perf"])("--sk-%s is not redefined inside the app", (name) => {
		expect(inside).not.toMatch(new RegExp(`--sk-${name}:`));
	});
});

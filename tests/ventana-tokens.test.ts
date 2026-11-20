/**
 * El mundo Ventana en `styles/ventana/` (vidrio ahumado estilo Liquid Glass):
 * suelo casi negro, tinta blanco roto, acción blanca sin acento, y un vidrio
 * oscuro cuya tinta se lee incluso con blanco puro detrás. Cada vidrio trae su
 * sólido de respaldo.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const tokens = read("../styles/ventana/tokens.css");
const glass = read("../styles/ventana/glass.css");
const type = read("../styles/ventana/type.css");
const controls = read("../styles/ventana/controls.css");
const content = read("../styles/ventana/content.css");
const all = tokens + glass + type + controls + content + read("../styles/ventana.css");
const allVentanaCss = [
	...readdirSync(new URL("../styles/ventana/", import.meta.url))
		.filter((f) => f.endsWith(".css"))
		.map((f) => read(`../styles/ventana/${f}`)),
	read("../styles/ventana.css"),
];

const block = tokens.match(/\n\.vn \{([\s\S]*?)\n\}/)?.[1] ?? "";
const token = (name: string) => block.match(new RegExp(`--vn-${name}:\\s*([^;]+);`))?.[1].trim();

function channels(color: string): [number, number, number, number] {
	const rgba = color.match(/rgba?\(([^)]+)\)/);
	if (rgba) {
		const [r, g, b, a = "1"] = rgba[1].split(",").map((s) => s.trim());
		return [Number(r), Number(g), Number(b), Number(a)];
	}
	const n = color.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
	return [r, g, b, 1];
}
function luminance(hex: string): number {
	const [r, g, b] = channels(hex).slice(0, 3).map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
/** Compone `top` (rgba o hex) sobre `bottom` (hex) y devuelve hex. */
function over(top: string, bottom: string): string {
	const [tr, tg, tb, ta] = channels(top);
	const [br, bg, bb] = channels(bottom);
	return "#" + [tr * ta + br * (1 - ta), tg * ta + bg * (1 - ta), tb * ta + bb * (1 - ta)].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

describe("Ventana tokens", () => {
	it("fija el suelo, las tintas y una acción blanca sin acento", () => {
		expect(token("ground")).toBe("#060607");
		expect(token("ink")).toBe("#f5f5f7");
		expect(token("action")).toBe("var(--vn-ink)");
	});

	it.each([
		["thin", "ink", 4.5],
		["thick", "ink", 4.5],
		["thick", "ink-2-glass", 4.5],
		["clear", "ink", 3],
	])("sobre blanco puro, %s deja leer %s a %s:1", (grade, ink, min) => {
		const behind = over(token("sheen")!, over(token(`smoke-${grade}`)!, "#ffffff"));
		expect(contrast(token(ink)!, behind)).toBeGreaterThanOrEqual(min);
	});

	it.each([
		["ink", "ground"],
		["ink", "surface"],
		["ink", "raised"],
		["ink-2", "ground"],
		["ink-2", "surface"],
		["ink-2", "raised"],
		["ink", "solid-thin"],
		["ink", "solid-thick"],
		["ink-2-glass", "solid-thick"],
	])("%s sobre %s pasa AA", (a, b) => {
		expect(contrast(token(a)!, token(b)!)).toBeGreaterThanOrEqual(4.5);
	});

	it("la tinta 3 no llega a AA: no es para texto", () => {
		expect(contrast(token("ink-3")!, token("ground")!)).toBeLessThan(4.5);
	});

	it("la fuente empieza por la del sistema de Apple y no sirve SF ni pasa por system-ui", () => {
		expect(token("font")).toMatch(/^-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter Tight Variable", sans-serif$/);
		expect(all).not.toMatch(/@font-face/);
	});

	it("cada vidrio tiene su sólido con transparencia reducida, contraste alto y sin backdrop-filter", () => {
		expect(glass).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
		expect(glass).toMatch(/@media \(prefers-contrast: more\)/);
		expect(glass).toMatch(/@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/);
	});

	it("el desenfoque baja a 12px en táctil y en estrecho", () => {
		expect(tokens).toMatch(/@media \(pointer: coarse\), \(max-width: 47\.9rem\)[\s\S]*--vn-blur-thin: 12px;[\s\S]*--vn-blur-thick: 12px;/);
	});

	it("no toca Feed vertical", () => {
		for (const file of allVentanaCss) {
			expect(file).not.toMatch(/--sk-/);
			expect(file).not.toMatch(/\.sk[\s.{,]/);
		}
	});
});

/** Cuerpo de la regla `selector { ... }`; con `media`, la que va dentro de ese bloque. */
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function rule(selector: string, media?: string): string {
	let scope = type;
	if (media) {
		const start = type.indexOf(`@media ${media} {`);
		scope = start < 0 ? "" : type.slice(start, type.indexOf("\n}", start));
	}
	return scope.match(new RegExp(`(?:^|\\n)\\t*${esc(selector)} \\{([^}]*)\\}`))?.[1] ?? "";
}

describe("Ventana letra y página", () => {
	it.each([
		[".vn .vn-display", 650, "clamp(2.75rem, 6vw, 5rem)", "1", "-0.04em"],
		[".vn .vn-title-1", 650, "2rem", "1.08", "-0.03em"],
		[".vn .vn-title-2", 600, "1.375rem", "1.2", "-0.02em"],
		[".vn .vn-title-3", 600, "1.0625rem", "1.3", "-0.01em"],
		[".vn .vn-body", 400, "0.9375rem", "1.55", ""],
		[".vn .vn-small", 400, "0.8125rem", "1.45", ""],
		[".vn .vn-label", 600, "0.75rem", "1", ""],
	])("%s trae su peso, tamaño, interlínea y tracking", (sel, weight, size, leading, tracking) => {
		const body = rule(sel);
		expect(body).toMatch(new RegExp(`font-weight: ${weight};`));
		expect(body).toMatch(new RegExp(`font-size: ${esc(size)};`));
		expect(body).toMatch(new RegExp(`line-height: ${esc(leading)};`));
		if (tracking) expect(body).toMatch(new RegExp(`letter-spacing: ${esc(tracking)};`));
	});
	it("title-1 sube a 2.5rem desde 48rem", () => {
		expect(rule(".vn .vn-title-1", "(min-width: 48rem)")).toMatch(/font-size: 2\.5rem/);
	});

	it("ningún font-weight de type.css pasa de 650", () => {
		const weights = [...type.matchAll(/font-weight:\s*(\d+)/g)].map((m) => Number(m[1]));
		expect(weights.length).toBeGreaterThan(0);
		expect(Math.max(...weights)).toBeLessThanOrEqual(650);
	});

	it(".vn-small usa la tinta 2 y .vn-num usa cifras tabulares", () => {
		expect(rule(".vn .vn-small")).toMatch(/color: var\(--vn-ink-2\)/);
		expect(rule(".vn .vn-num")).toMatch(/font-variant-numeric: tabular-nums/);
	});

	it("la columna de página mide 1240px con márgenes 16, 24 y 32", () => {
		expect(rule(".vn .vn-wrap")).toMatch(/max-width: 1240px/);
		expect(rule(".vn .vn-wrap")).toMatch(/padding-inline: 16px/);
		expect(rule(".vn .vn-wrap", "(min-width: 40rem)")).toMatch(/padding-inline: 24px/);
		expect(rule(".vn .vn-wrap", "(min-width: 64rem)")).toMatch(/padding-inline: 32px/);
	});

	it("el enlace subraya al pasar y con foco, y la prosa corta a 70ch", () => {
		expect(type).toMatch(/\.vn \.vn-link:hover/);
		expect(type).toMatch(/\.vn \.vn-link:focus-visible/);
		expect(rule(".vn .vn-prose")).toMatch(/max-width: 70ch/);
	});
});

describe("Ventana scrim y brillo", () => {
	it("el titular sobre el scrim llega a 4.5:1 incluso sobre blanco puro", () => {
		expect(contrast(token("ink")!, over("rgba(6,6,7,0.72)", "#ffffff"))).toBeGreaterThanOrEqual(4.5);
	});

	it("el scrim usa ese mismo degradado en su borde", () => {
		expect(glass).toMatch(/\.vn-scrim[\s\S]*rgba\(6, 6, 7, 0\.72\)/);
	});

	it("el brillo está quieto: su CSS no tiene animation", () => {
		const start = glass.indexOf(".vn-glow {");
		expect(start).toBeGreaterThan(-1);
		const body = glass.slice(start, glass.indexOf("\n}", start));
		expect(body).toMatch(/filter: blur\(60px\)/);
		expect(body).not.toMatch(/animation/);
		expect(glass.slice(start)).not.toMatch(/animation|@keyframes/);
	});
});

/** Cuerpo de la regla `selector { ... }` de controls.css, a nivel raíz. */
const ctl = (selector: string) => controls.match(new RegExp(`(?:^|\n)${esc(selector)} \{([^}]*)\}`))?.[1] ?? "";

describe("Ventana controles", () => {
	it(".vn-btn no fija width y su nowrap trae max-width 100% con ellipsis", () => {
		const body = ctl(".vn .vn-btn");
		expect(body).not.toMatch(/(^|[^-])width:/);
		expect(body).toMatch(/white-space: nowrap;/);
		expect(body).toMatch(/max-inline-size: 100%;/);
		expect(body).toMatch(/text-overflow: ellipsis;/);
		expect(ctl(".vn .vn-btn__label")).toMatch(/overflow: hidden;[\s\S]*text-overflow: ellipsis;/);
	});

	it("el foco visible usa var(--vn-focus)", () => {
		expect(ctl(".vn .vn-btn:focus-visible")).toMatch(/box-shadow: var\(--vn-focus\)/);
	});

	it("la primaria es acción sobre tinta de acción, y se lee", () => {
		const body = ctl(".vn .vn-btn--primary");
		expect(body).toMatch(/background: var\(--vn-action\);/);
		expect(body).toMatch(/color: var\(--vn-action-ink\);/);
		const resolve = (value: string): string => {
			const ref = value.match(/^var\(--vn-([\w-]+)\)$/);
			return ref ? resolve(token(ref[1])!) : value;
		};
		expect(contrast(token("action-ink")!, resolve(token("action")!))).toBeGreaterThanOrEqual(4.5);
	});

	it("el hover sólo existe con puntero fino y el área de toque llega a 44px", () => {
		const hovers = controls.match(/:hover/g)?.length ?? 0;
		const inMedia = controls.slice(controls.indexOf("@media (hover: hover) and (pointer: fine)"));
		expect((inMedia.match(/:hover/g) ?? []).length).toBe(hovers);
		expect(controls).toMatch(/inset-block: calc\(\(44px - var\(--vn-btn-h\)\) \/ -2\)/);
	});

	it("repite la transición de .vn-press (scale) en vez de pisarla", () => {
		expect(ctl(".vn .vn-btn")).toMatch(/scale var\(--vn-spring-snap-ms\) var\(--vn-spring-snap\)/);
	});

	it("el danger se lee sobre el suelo", () => {
		expect(contrast(token("danger")!, token("ground")!)).toBeGreaterThanOrEqual(4.5);
	});

	/*
	 * El material del vidrio (`.vn-glass`, 0,1,0) y sus respaldos viven en glass.css.
	 * Cualquier regla de controls.css (0,2,0 o más) que pueda caer sobre un botón de
	 * vidrio y declare lo que el material posee, lo pisa en todos los casos.
	 */
	const rules = [...(controls + content).replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
		selectors: m[1].split(",").map((x) => x.trim()),
		body: m[2],
	}));
	const owned = /(^|[;\s])(background(-color|-image)?|backdrop-filter|-webkit-backdrop-filter|border|border-color|box-shadow)\s*:/;
	/**
	 * Clases de las piezas sólidas por diseño: pintan su propio fondo y borde porque
	 * nunca llevan `vn-glass` (lo comprueba la prueba de marcado de cada pieza). Una
	 * pieza sólida nueva añade aquí una línea; olvidarla hace fallar el análisis,
	 * que es el lado seguro.
	 */
	/** Los disparadores del desplegable son sólidos; la fila pinta su propio resaltado (nunca lleva vn-glass, hay prueba) y vive dentro del panel de vidrio. */
	const SOLID_PIECES = [
		"vn-input",
		"vn-input--area",
		"vn-select-trigger",
		"vn-select-trigger--field",
		"vn-select-trigger--chip",
		"vn-select-item",
		"vn-seg",
		"vn-seg-opt",
		"vn-switch",
		"vn-switch__track",
		"vn-switch__knob",
		"vn-check__box",
		// Chip sólido y sus botones internos (transparentes sobre el chip, nunca llevan vn-glass; hay prueba de marcado)
		"vn-chip--solid",
		"vn-chip__main",
		"vn-chip__x",
		// Etiquetas de estado sólidas (la «lista» es vidrio compuesto y NO va aquí) y marco de video
		"vn-state--draft",
		"vn-state--generating",
		"vn-state--failed",
		"vn-frame",
		// El envoltorio del rótulo pinta su propio scrim; nunca lleva vn-glass (hay prueba de marcado)
		"vn-frame__caption",
	];
	/** Variantes de botón que poseen su fondo: no llevan material. */
	const OWN_BACKGROUND_BUTTONS = ["vn-btn--primary", "vn-btn--plain", "vn-btn--danger"];

	/** Clases del sujeto del selector (su último compuesto), sin lo que va dentro de paréntesis o corchetes. */
	function subjectClasses(selector: string): string[] {
		let depth = 0;
		let compound = "";
		let bare = "";
		for (const ch of selector.trim()) {
			if (depth === 0 && /[\s>+~]/.test(ch)) {
				compound = "";
				bare = "";
				continue;
			}
			compound += ch;
			if (ch === "(" || ch === "[") depth++;
			else if (ch === ")" || ch === "]") depth--;
			else if (depth === 0) bare += ch;
		}
		return [...bare.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
	}
	const targets = (selector: string, classes: string[]) => subjectClasses(selector).some((c) => classes.includes(c));
	const exemptFromScan = (sel: string) => targets(sel, [...SOLID_PIECES, ...OWN_BACKGROUND_BUTTONS]);

	it("subjectClasses mira sólo el sujeto, con nombre exacto", () => {
		expect(subjectClasses(".vn .vn-input:focus-visible")).toEqual(["vn-input"]);
		expect(subjectClasses(".vn-glass .vn-input")).toEqual(["vn-input"]);
		expect(subjectClasses(".vn-input .vn-btn")).toEqual(["vn-btn"]);
		expect(subjectClasses(".vn .vn-btn:not(.vn-input)")).toEqual(["vn-btn"]);
		expect(subjectClasses('.vn .vn-input[aria-invalid="true"]')).toEqual(["vn-input"]);
		expect(targets(".vn .vn-input-foo", SOLID_PIECES)).toBe(false);
		expect(targets(".vn .vn-btn:has(.vn-input)", SOLID_PIECES)).toBe(false);
		expect(targets(".vn .vn-input .vn-btn", SOLID_PIECES)).toBe(false);
	});

	it("ninguna regla que alcance un botón de vidrio declara lo que el material posee", () => {
		const reaching = rules.filter((r) => r.selectors.some((sel) => !exemptFromScan(sel)));
		expect(reaching.length).toBeGreaterThan(3);
		for (const r of reaching) {
			let body = r.body;
			// El anillo de foco es un estado: sustituye el brillo de borde sólo mientras hay foco
			if (r.selectors.every((sel) => sel.includes(":focus-visible"))) body = body.replace(/box-shadow:[^;]*;/g, "");
			expect(body, r.selectors.join(", ")).not.toMatch(owned);
		}
	});

	it("el vidrio toma sombra y filete de variables con los tokens de siempre como valor por defecto", () => {
		const body = glass.match(/\n\.vn-glass \{([^}]*)\}/)?.[1] ?? "";
		expect(body).toMatch(/border: 1px solid var\(--vn-glass-rim, var\(--vn-rim\)\);/);
		expect(body).toMatch(/box-shadow: inset 0 1px 0 var\(--vn-rim-top\), var\(--vn-glass-shadow, 0 12px 40px rgba\(0, 0, 0, 0\.35\)\);/);
		expect(body).not.toMatch(/--vn-glass-(fill|smoke-alpha)/);
	});

	it("los botones de vidrio ajustan la sombra y, con puntero fino, el filete, sólo por variable", () => {
		const shadow = rules.find((r) => r.selectors.includes(".vn .vn-btn.vn-glass") && /--vn-glass-shadow:/.test(r.body));
		expect(shadow).toBeTruthy();
		const hover = rules.find((r) => r.selectors.includes(".vn .vn-btn.vn-glass:hover"));
		expect(hover?.body).toMatch(/--vn-glass-rim: var\(--vn-rim-top\);/);
		expect(controls.indexOf(".vn .vn-btn.vn-glass:hover")).toBeGreaterThan(controls.indexOf("@media (hover: hover) and (pointer: fine)"));
	});

	it("la base no pinta fondo y son plain y danger quienes lo reinician", () => {
		expect(ctl(".vn .vn-btn")).not.toMatch(owned);
		const resets = rules.filter((r) => /background:\s*transparent/.test(r.body)).flatMap((r) => r.selectors);
		expect(resets.some((sel) => sel.includes("--plain"))).toBe(true);
		expect(resets.some((sel) => sel.includes("--danger"))).toBe(true);
		// Salvo las piezas sólidas por diseño, sólo las variantes de botón con fondo propio reinician el fondo
		expect(resets.filter((sel) => !targets(sel, SOLID_PIECES)).every((sel) => targets(sel, OWN_BACKGROUND_BUTTONS))).toBe(true);
	});

	it("los campos son sólidos: suelo, filete, radio de campo, 44px y sin desenfoque", () => {
		const body = ctl(".vn .vn-input");
		expect(body).toMatch(/background: var\(--vn-ground\);/);
		expect(body).toMatch(/border: 1px solid var\(--vn-line\);/);
		expect(body).toMatch(/border-radius: var\(--vn-r-field\);/);
		expect(body).toMatch(/min-block-size: 44px;/);
		const fieldRules = rules.filter((x) => x.selectors.some((sel) => sel.includes("vn-input")));
		expect(fieldRules.length).toBeGreaterThan(3);
		for (const r of fieldRules) expect(r.body, r.selectors.join(", ")).not.toMatch(/backdrop-filter/);
	});

	it("el foco del campo es su borde en tinta más el anillo, y el error usa danger", () => {
		const focus = ctl(".vn .vn-input:focus-visible");
		expect(focus).toMatch(/border-color: var\(--vn-ink\);/);
		expect(focus).toMatch(/box-shadow: var\(--vn-focus\);/);
		expect(ctl('.vn .vn-input[aria-invalid="true"]')).toMatch(/border-color: var\(--vn-danger\);/);
		expect(ctl(".vn .vn-field__msg--error")).toMatch(/color: var\(--vn-danger\);/);
	});

	it("el texto del campo y su ayuda se leen sobre el suelo", () => {
		expect(contrast(token("ink")!, token("ground")!)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("ink-2")!, token("ground")!)).toBeGreaterThanOrEqual(4.5);
	});

	it("el panel del desplegable es vidrio: sus reglas sólo ajustan el material por variable", () => {
		const panel = rules.filter((r) => r.selectors.some((sel) => /vn-select-(panel|viewport|hint|check|lock)\b/.test(sel)));
		expect(panel.length).toBeGreaterThan(5);
		for (const r of panel) expect(r.body, r.selectors.join(", ")).not.toMatch(owned);
		expect(ctl(".vn .vn-select-panel")).toMatch(/--vn-glass-r: var\(--vn-r-panel\);/);
		expect(ctl(".vn .vn-select-panel")).toMatch(/transform-origin: var\(--radix-select-content-transform-origin\);/);
		expect(controls).toMatch(/animation: vn-select-in var\(--vn-spring-snap-ms\) var\(--vn-spring-snap\)/);
	});

	it("el texto secundario de la lista usa la tinta de vidrio grueso, no la sólida", () => {
		expect(ctl(".vn .vn-select-hint")).toMatch(/color: var\(--vn-ink-2-glass\);/);
		expect(ctl(".vn .vn-select-item")).toMatch(/min-block-size: 44px;/);
	});

	it("el disparador es sólido: campo en suelo, cápsula en raised, ambos con filete", () => {
		expect(ctl(".vn .vn-select-trigger")).toMatch(/background: var\(--vn-ground\);/);
		expect(ctl(".vn .vn-select-trigger")).toMatch(/border: 1px solid var\(--vn-line\);/);
		expect(ctl(".vn .vn-select-trigger--chip")).toMatch(/background: var\(--vn-raised\);/);
	});

	it("el pulgar del segmentado es vidrio: sus reglas sólo ajustan el material por variable", () => {
		const thumb = rules.filter((r) => r.selectors.some((sel) => /vn-seg-thumb\b/.test(sel)));
		expect(thumb.length).toBeGreaterThan(2);
		for (const r of thumb) expect(r.body, r.selectors.join(", ")).not.toMatch(owned);
		expect(ctl(".vn .vn-seg-thumb")).toMatch(/--vn-glass-r: var\(--vn-r-pill\);/);
		expect(controls).toMatch(/var\(--vn-seg-x/);
		expect(controls).toMatch(/var\(--vn-seg-w/);
	});

	it("el riel, el interruptor y la casilla son sólidos y de tinta, sin acento", () => {
		expect(ctl(".vn .vn-seg")).toMatch(/background: var\(--vn-surface\);/);
		expect(ctl(".vn .vn-seg")).toMatch(/border: 1px solid var\(--vn-hair\);/);
		expect(ctl(".vn .vn-switch__track")).toMatch(/background: var\(--vn-raised\);/);
		expect(ctl('.vn .vn-switch[aria-checked="true"] .vn-switch__track')).toMatch(/background: var\(--vn-ink\);/);
		expect(ctl('.vn .vn-switch[aria-checked="true"] .vn-switch__knob')).toMatch(/background: var\(--vn-action-ink\);/);
		expect(ctl(".vn .vn-switch__track")).toMatch(/inline-size: 51px;[\s\S]*block-size: 31px;/);
		expect(ctl(".vn .vn-switch")).toMatch(/block-size: 44px;/);
		expect(ctl(".vn .vn-check__input:checked + .vn-check__box")).toMatch(/background: var\(--vn-ink\);/);
		expect(ctl(".vn .vn-check")).toMatch(/min-block-size: 44px;/);
	});

	it("la perilla apagada y la marca se ven contra su fondo", () => {
		expect(contrast(token("ink-2")!, token("raised")!)).toBeGreaterThanOrEqual(3);
		expect(contrast(token("action-ink")!, token("ink")!)).toBeGreaterThanOrEqual(4.5);
	});

	/** Cuerpo de la regla `selector { ... }` de content.css, a nivel raíz. */
	const cnt = (selector: string) => content.match(new RegExp(`(?:^|\n)${esc(selector)} \\{([^}]*)\\}`))?.[1] ?? "";
	const chipCss = controls.slice(controls.indexOf("* Chips."));

	it("content.css entra por ventana.css y por la lista de todo el CSS de Ventana", () => {
		expect(read("../styles/ventana.css")).toMatch(/@import "\.\/ventana\/content\.css";/);
		expect(allVentanaCss.some((css) => css.includes(".vn-frame"))).toBe(true);
	});

	it("la base del chip y de la etiqueta de estado no declara material", () => {
		expect(ctl(".vn .vn-chip")).not.toMatch(owned);
		expect(cnt(".vn .vn-state")).not.toMatch(owned);
		expect(ctl(".vn .vn-chip")).not.toMatch(/border-radius/);
	});

	it("el chip no trunca ni fija un ancho en px: el texto baja de línea", () => {
		const body = ctl(".vn .vn-chip");
		expect(body).toMatch(/white-space: normal;/);
		expect(body).toMatch(/max-inline-size: 100%;/);
		expect(body).not.toMatch(/text-overflow|(^|[^-])(width|max-width|max-inline-size):\s*\d+px/);
		expect(body).not.toMatch(/(^|[^-])(block-size|height):/);
	});

	it("el chip sólido es raised con filete y, seleccionado, tinta con letra de acción; ambos se leen", () => {
		const solid = ctl(".vn .vn-chip--solid");
		expect(solid).toMatch(/background: var\(--vn-raised\);/);
		expect(solid).toMatch(/border: 1px solid var\(--vn-line\);/);
		const selected = ctl(".vn .vn-chip--solid.is-selected");
		expect(selected).toMatch(/background: var\(--vn-ink\);/);
		expect(selected).toMatch(/color: var\(--vn-action-ink\);/);
		expect(contrast(token("ink")!, token("raised")!)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("action-ink")!, token("ink")!)).toBeGreaterThanOrEqual(4.5);
	});

	it("el chip de vidrio sólo se ajusta por variable y lleva tinta primaria, nunca secundaria", () => {
		const glassRules = rules.filter((r) => r.selectors.some((sel) => /vn-chip--glass\b/.test(sel)));
		expect(glassRules.length).toBeGreaterThan(2);
		for (const r of glassRules) {
			// Como en el análisis general: el anillo de foco es un estado y sustituye el brillo de borde mientras dura
			const body = r.selectors.every((sel) => sel.includes(":focus-visible")) ? r.body.replace(/box-shadow:[^;]*;/g, "") : r.body;
			expect(body, r.selectors.join(", ")).not.toMatch(owned);
		}
		expect(ctl(".vn .vn-chip--glass")).toMatch(/--vn-glass-shadow:/);
		expect(ctl(".vn .vn-chip")).toMatch(/--vn-glass-r: var\(--vn-r-pill\);/);
		for (const r of glassRules) expect(r.body, r.selectors.join(", ")).not.toMatch(/--vn-ink-[23]/);
		const hover = rules.find((r) => r.selectors.some((sel) => /vn-chip--glass.*:hover/.test(sel)));
		expect(hover?.body).toMatch(/--vn-glass-rim: var\(--vn-rim-top\);/);
	});

	it("el hover del chip sólo existe con puntero fino", () => {
		const hovers = chipCss.match(/:hover/g)?.length ?? 0;
		const media = chipCss.slice(chipCss.indexOf("@media (hover: hover) and (pointer: fine)"), chipCss.indexOf("/* Movimiento reducido"));
		expect(hovers).toBeGreaterThan(0);
		expect((media.match(/:hover/g) ?? []).length).toBe(hovers);
	});

	it("el aspa mide 20px y su área de toque 44px; el chip botón sube de 32 a 44", () => {
		expect(ctl(".vn .vn-chip__x")).toMatch(/inline-size: 20px;[\s\S]*block-size: 20px;/);
		expect(ctl(".vn .vn-chip__x::after")).toMatch(/inset: -12px;/);
		expect(controls).toMatch(/\.vn \.vn-chip__main::after \{[^}]*inset-block: -6px;/);
		expect(ctl(".vn .vn-chip")).toMatch(/min-block-size: 32px;/);
	});

	it("el foco del chip es el anillo de tinta", () => {
		const focus = rules.filter((r) => r.selectors.some((sel) => /vn-chip.*:focus-visible/.test(sel)));
		expect(focus.length).toBeGreaterThan(1);
		expect(focus.some((r) => /box-shadow: var\(--vn-focus\)/.test(r.body))).toBe(true);
	});

	it("las etiquetas de estado: borrador con filete, generando en tinta, falló en danger, lista en vidrio fino", () => {
		expect(cnt(".vn .vn-state--draft")).toMatch(/background: transparent;[\s\S]*border: 1px solid var\(--vn-line\);/);
		const generating = cnt(".vn .vn-state--generating");
		expect(generating).toMatch(/background: var\(--vn-ink\);/);
		expect(generating).toMatch(/color: var\(--vn-action-ink\);/);
		const failed = cnt(".vn .vn-state--failed");
		expect(failed).toMatch(/background: transparent;[\s\S]*border: 1px solid var\(--vn-danger\);/);
		expect(failed).toMatch(/color: var\(--vn-danger\);/);
		expect(contrast(token("danger")!, token("surface")!)).toBeGreaterThanOrEqual(4.5);
		// «lista» compone vn-glass: sus reglas no declaran lo que el material posee
		const ready = rules.filter((r) => r.selectors.some((sel) => /vn-state--ready\b/.test(sel)));
		expect(ready.length).toBeGreaterThan(0);
		for (const r of ready) expect(r.body, r.selectors.join(", ")).not.toMatch(owned);
	});

	it("el marco de video fija su formato, el radio de panel y es sólido", () => {
		expect(cnt(".vn .vn-frame--9x16")).toMatch(/aspect-ratio: 9 \/ 16;/);
		expect(cnt(".vn .vn-frame--1x1")).toMatch(/aspect-ratio: 1 \/ 1;/);
		expect(cnt(".vn .vn-frame--16x9")).toMatch(/aspect-ratio: 16 \/ 9;/);
		expect(cnt(".vn .vn-frame")).toMatch(/border-radius: var\(--vn-r-panel\);/);
		expect(cnt(".vn .vn-frame")).toMatch(/overflow: hidden;/);
	});

	it("el rótulo lleva su propio scrim, medido por el texto: meseta 0.72 bajo todo el bloque, sin tope de altura", () => {
		const cap = cnt(".vn .vn-frame__caption");
		expect(cap).not.toMatch(/max-block-size|max-height|(^|[^-])block-size:|(^|[^-])height:/);
		expect(content).not.toMatch(/vn-frame__scrim/);
		expect(cap).toMatch(/pointer-events: none;/);
		// Un solo valor decide el relleno superior y dónde acaba la meseta: la meseta cubre el texto y su relleno inferior
		const fade = cap.match(/--vn-cap-fade: ([^;]+);/)?.[1];
		expect(fade).toBeTruthy();
		expect(cap).toMatch(/padding: var\(--vn-cap-fade\) /);
		expect(cap).toMatch(/rgba\(6, 6, 7, 0\.72\) 0%,\s*rgba\(6, 6, 7, 0\.72\) calc\(100% - var\(--vn-cap-fade\)\)/);
		// Nada por encima de la meseta cubre texto: los demás puntos están más arriba y bajan de 0.72
		const alphas = [...cap.matchAll(/rgba\(6, 6, 7, ([\d.]+)\)/g)].map((m) => Number(m[1]));
		expect(alphas[0]).toBe(0.72);
		expect(Math.max(...alphas)).toBe(0.72);
		expect(contrast(token("ink")!, over("rgba(6,6,7,0.72)", "#ffffff"))).toBeGreaterThanOrEqual(4.5);
	});

	it("el texto del rótulo se corta a dos líneas con puntos suspensivos y el tamaño escala con el marco sin bajar de 0.75rem", () => {
		const text = cnt(".vn .vn-frame__text");
		expect(text).toMatch(/display: -webkit-box;/);
		expect(text).toMatch(/-webkit-box-orient: vertical;/);
		expect(text).toMatch(/-webkit-line-clamp: 2;/);
		expect(text).toMatch(/(^|[^-])line-clamp: 2;/);
		expect(text).toMatch(/overflow: hidden;/);
		expect(cnt(".vn .vn-frame__caption")).toMatch(/font-size: clamp\(0\.75rem, [^,]*cqi, [\d.]+rem\);/);
		expect(cnt(".vn .vn-frame")).toMatch(/container-type: inline-size;/);
	});

	it("ningún texto nuevo baja de 0.75rem", () => {
		for (const css of [chipCss, content]) {
			const sizes = [...css.matchAll(/font-size: (?:clamp\()?([\d.]+)rem/g)].map((m) => Number(m[1]));
			expect(sizes.length).toBeGreaterThan(0);
			for (const size of sizes) expect(size).toBeGreaterThanOrEqual(0.75);
		}
	});
});

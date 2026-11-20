/**
 * El mundo Ventana en `styles/ventana/` (vidrio ahumado estilo Liquid Glass):
 * suelo casi negro, tinta blanco roto, acción blanca sin acento, y un vidrio
 * oscuro cuya tinta se lee incluso con blanco puro detrás. Cada vidrio trae su
 * sólido de respaldo.
 *
 * La garantía de contraste del vidrio es aritmética sobre los tokens. Lo que hay
 * detrás llega desenfocado y saturado, y ninguna de las dos cosas saca un canal
 * por encima de blanco puro; encima van el humo y, arriba, el brillo. El peor
 * caso es `brillo sobre (humo sobre #ffffff)`. Las pruebas de «la receta»
 * sostienen que eso es de verdad lo que pinta glass.css (dos capas y un filtro
 * que no aclara): si la receta cambia, cambia el modelo, nunca el umbral.
 *
 * Dentro de un ámbito `vn-lit` el vidrio es luminoso: sin humo, y es el filtro
 * quien atenúa lo de detrás (`brightness`, tras saturar al 140 %); la capa plana
 * es una escarcha (un 6 % de blanco) y encima va el brillo. Ahí la garantía es
 * sobre un techo declarado por grado, y el modelo es
 * `brillo sobre (escarcha sobre (atenuación × fondo saturado))`. Es una cota, no
 * una simulación: cada capa redondea HACIA ARRIBA, el filtro sólo recorta a
 * 0..255 al final (nunca entre saturar y atenuar, que daría un resultado más
 * oscuro que el de un motor que no recorte ahí) y el techo lleva una holgura de
 * 2 niveles (pasa aun con el fondo 2 niveles más claro: lo que Chrome midió de
 * más sobre la cuenta). La misma cuenta vive en `ventana/glass-contrast.ts` para
 * quien use el vidrio; aquí se rehace con los tokens, se comprueba que sus
 * números son los mismos y que el ámbito sólo cambia variables, nunca el
 * material ni sus respaldos. Las pruebas del ahumado siguen redondeando al más
 * cercano, como siempre: su garantía es sobre blanco puro y tiene margen.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AI_SPECTRUM } from "../ventana/ai-mark";
import { GLASS, glassContrast, passesOnGlass, underGlass, type GlassGrade } from "../ventana/glass-contrast";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const tokens = read("../styles/ventana/tokens.css");
const glass = read("../styles/ventana/glass.css");
const type = read("../styles/ventana/type.css");
const controls = read("../styles/ventana/controls.css");
const content = read("../styles/ventana/content.css");
const overlays = read("../styles/ventana/overlays.css");
const all = tokens + glass + type + controls + content + overlays + read("../styles/ventana.css");
const allVentanaCss = [
	...readdirSync(new URL("../styles/ventana/", import.meta.url))
		.filter((f) => f.endsWith(".css"))
		.map((f) => read(`../styles/ventana/${f}`)),
	read("../styles/ventana.css"),
];

/**
 * Los tokens viven en dos reglas: la raíz `.vn` y, aparte, los valores vivos del
 * vidrio en su densidad ahumada, que la raíz comparte con las islas ahumadas de
 * una zona luminosa (un vidrio dentro de otro, lo que flota sobre un marco de video).
 */
const liveRule = tokens.match(/\n(\.vn,\n[^{]*) \{([\s\S]*?)\n\}/);
const liveSelectors = (liveRule?.[1] ?? "").split(",").map((x) => x.trim());
const block = (tokens.match(/\n\.vn \{([\s\S]*?)\n\}/)?.[1] ?? "") + (liveRule?.[2] ?? "");
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

const GRADES: GlassGrade[] = ["clear", "thin", "thick"];
/** Un gris neutro de 0 a 255 como hex. */
const grey = (v: number) => "#" + v.toString(16).padStart(2, "0").repeat(3);
/** Redondeo hacia arriba (el del modelo del luminoso), sin que el ruido de la coma flotante suba un valor exacto. */
const up = (c: number) => Math.min(255, Math.ceil(c - 1e-9));
/** `brightness(dim)` sobre un hex, hacia arriba: cada canal por el factor. */
const dimmedUp = (hex: string, dim: number) => "#" + channels(hex).slice(0, 3).map((c) => up(c * dim).toString(16).padStart(2, "0")).join("");
/** Como `over`, pero redondeando hacia arriba. */
function overUp(top: string, bottom: string): string {
	const [tr, tg, tb, ta] = channels(top);
	const [br, bg, bb] = channels(bottom);
	return "#" + [tr * ta + br * (1 - ta), tg * ta + bg * (1 - ta), tb * ta + bb * (1 - ta)].map((c) => up(c).toString(16).padStart(2, "0")).join("");
}
/** La holgura del techo del luminoso, en niveles de fondo. */
const MARGIN = 2;
/** Todas las reglas de las hojas de Ventana (sin comentarios), con sus selectores y su cuerpo. */
const everyRule = [...allVentanaCss.join("\n").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
	selectors: m[1].split(",").map((x) => x.trim()),
	body: m[2],
}));
/** Las declaraciones de un cuerpo de regla: nombre de la propiedad y valor. */
const declarations = (body: string) => body.split(";").map((d) => d.trim()).filter(Boolean).map((d) => [d.slice(0, d.indexOf(":")).trim(), d.slice(d.indexOf(":") + 1).trim()] as const);
/** La especificidad de un selector hecho sólo de clases: cuántas lleva. */
const classCount = (selector: string) => selector.match(/\./g)?.length ?? 0;

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

	const glassRule = glass.match(/\n\.vn-glass \{([^}]*)\}/)?.[1] ?? "";

	it("la receta del vidrio es la que modela la aritmética: brillo sobre humo, las dos en la caja de relleno", () => {
		expect(glassRule).toMatch(
			/background:\s*linear-gradient\(var\(--vn-sheen\), transparent 40%\) padding-box,\s*linear-gradient\(var\(--vn-glass-smoke\), var\(--vn-glass-smoke\)\) padding-box;/,
		);
		// Ni una capa más: nada aclara el relleno aparte del brillo
		expect(glassRule.match(/-gradient\(/g)).toHaveLength(2);
		expect(token("sheen")).toBe("rgba(255, 255, 255, 0.06)");
		// La línea de luz de dentro mide 1px y va pegada al borde de arriba: no queda bajo el texto
		expect(glassRule).toMatch(/--vn-glass-elevation: inset 0 1px 0 var\(--vn-glint\),/);
		expect(glassRule.match(/inset/g)).toHaveLength(1);
	});

	it("el filtro del vidrio desenfoca, satura y atenúa por variable; fuera de una zona luminosa la atenuación es 1", () => {
		for (const prop of ["-webkit-backdrop-filter", "backdrop-filter"]) {
			expect(glassRule).toContain(`\t${prop}: blur(var(--vn-glass-blur)) saturate(var(--vn-saturate)) brightness(var(--vn-glass-dim, 1));`);
		}
		// Ese `brightness` (una vez por propiedad) es el único de la hoja, y no hay otra función que modelar
		expect(glass.match(/brightness\(/g)).toHaveLength(2);
		expect(glass.match(/brightness\(var\(--vn-glass-dim, 1\)\)/g)).toHaveLength(2);
		expect(glass).not.toMatch(/contrast\(|invert\(|opacity\(/);
		// Cada grado toma su atenuación del token vivo, que en el ahumado vale 1: ahí el filtro ni oscurece ni aclara
		expect(glassRule).toMatch(/--vn-glass-dim: var\(--vn-dim-thin\);/);
		for (const grade of GRADES) {
			expect(glass).toMatch(new RegExp(`\\.vn-glass--${grade} \\{[^}]*--vn-glass-dim: var\\(--vn-dim-${grade}\\);`));
			expect(token(`dim-${grade}`)).toBe("1");
		}
	});

	it("fija el humo de cada grado: un gris frío, más opaco cuanto más grueso", () => {
		expect(token("smoke-clear")).toBe("rgba(58, 58, 64, 0.64)");
		expect(token("smoke-thin")).toBe("rgba(44, 44, 50, 0.74)");
		expect(token("smoke-thick")).toBe("rgba(32, 32, 37, 0.84)");
	});

	it.each(["clear", "thin", "thick"])("sobre negro puro, %s no es una tarjeta negra: el humo levanta el negro", (grade) => {
		const pane = over(token(`smoke-${grade}`)!, "#000000");
		expect(contrast(pane, "#000000")).toBeGreaterThanOrEqual(1.2);
		expect(luminance(pane)).toBeGreaterThan(luminance(token("ground")!) * 3);
	});

	it("cuanto más grueso el vidrio, más oscuro queda con blanco detrás y menos deja pasar", () => {
		const white = (grade: string) => luminance(over(token("sheen")!, over(token(`smoke-${grade}`)!, "#ffffff")));
		expect(white("clear")).toBeGreaterThan(white("thin"));
		expect(white("thin")).toBeGreaterThan(white("thick"));
		const alpha = (grade: string) => channels(token(`smoke-${grade}`)!)[3];
		expect(alpha("clear")).toBeLessThan(alpha("thin"));
		expect(alpha("thin")).toBeLessThan(alpha("thick"));
	});

	it.each([
		["thick", "thin", "ink", 4.5],
		["thick", "clear", "ink", 3],
		["thin", "thin", "ink", 4.5],
		["thin", "clear", "ink", 3],
		["thick", "thick", "ink-2-glass", 4.5],
	])("un vidrio dentro de otro no aclara: dentro de %s, %s deja leer %s", (outer, inner, ink, min) => {
		// Donde el navegador no deja a un vidrio anidado ver el video, lo que tiene detrás es el vidrio de fuera
		const outerWorst = over(token("sheen")!, over(token(`smoke-${outer}`)!, "#ffffff"));
		const nested = over(token("sheen")!, over(token(`smoke-${inner}`)!, outerWorst));
		const alone = over(token("sheen")!, over(token(`smoke-${inner}`)!, "#ffffff"));
		expect(contrast(token(ink)!, nested)).toBeGreaterThanOrEqual(min);
		expect(contrast(token(ink)!, nested)).toBeGreaterThanOrEqual(contrast(token(ink)!, alone));
	});

	it("sin vidrio, el sólido de respaldo lleva el contraste él solo", () => {
		expect(contrast(token("ink")!, token("solid-clear")!)).toBeGreaterThanOrEqual(3);
		expect(contrast(token("ink")!, token("solid-thin")!)).toBeGreaterThanOrEqual(4.5);
		for (const t of ["ink", "ink-2-glass", "danger-glass"]) expect(contrast(token(t)!, token("solid-thick")!), t).toBeGreaterThanOrEqual(4.5);
		// Una fila resaltada dentro de un panel en su versión sólida
		expect(contrast(token("ink")!, over(token("hair")!, token("solid-thick")!))).toBeGreaterThanOrEqual(4.5);
	});

	it("los cuatro respaldos ponen el sólido y quitan el desenfoque", () => {
		const bodyAfter = (marker: string) => {
			const from = glass.indexOf(marker);
			expect(from, marker).toBeGreaterThan(-1);
			return glass.slice(from).match(/\.vn-glass(?:--solid)? \{([^}]*)\}/)?.[1] ?? "";
		};
		for (const marker of [
			"\n.vn-glass--solid {",
			"@media (prefers-reduced-transparency: reduce)",
			"@media (prefers-contrast: more)",
			"@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))",
		]) {
			const body = bodyAfter(marker);
			expect(body, marker).toMatch(/background: var\(--vn-glass-solid\);/);
			expect(body, marker).toMatch(/(^|\s)backdrop-filter: none;/);
			expect(body, marker).toMatch(/-webkit-backdrop-filter: none;/);
		}
		expect(bodyAfter("@media (prefers-contrast: more)")).toMatch(/border-color: var\(--vn-ink\);/);
	});

	it("las esquinas continuas no tocan las cápsulas: superelipse suave en las láminas, round en lo que es cápsula", () => {
		expect(glass).toMatch(/@supports \(corner-shape: superellipse\(1\.5\)\) \{\s*\.vn-glass \{\s*corner-shape: superellipse\(1\.5\);\s*border-radius: calc\(var\(--vn-glass-r, var\(--vn-r-panel\)\) \* 1\.35\);/);
		for (const css of allVentanaCss) expect(css).not.toMatch(/corner-shape: squircle/);
		const bodyOf = (css: string, selector: string) => css.split(`\n${selector} {`)[1]?.split("}")[0] ?? "";
		expect(bodyOf(controls, ".vn .vn-btn")).toMatch(/corner-shape: round;/);
		expect(bodyOf(controls, ".vn .vn-chip")).toMatch(/corner-shape: round;/);
		expect(bodyOf(controls, ".vn .vn-seg-thumb")).toMatch(/corner-shape: round;/);
		expect(bodyOf(content, ".vn .vn-state")).toMatch(/corner-shape: round;/);
		expect(bodyOf(overlays, ".vn.vn-nav__bar")).toMatch(/corner-shape: round;/);
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
		// En ninguna hoja, no sólo en el token: en Windows system-ui es Segoe UI y se colaría delante de la de respaldo
		for (const css of allVentanaCss) expect(css).not.toMatch(/system-ui/);
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

describe("Ventana vidrio luminoso (el ámbito vn-lit)", () => {
	const litRules = everyRule.filter((r) => r.selectors.some((sel) => sel.includes("vn-lit")));
	const scope = litRules.find((r) => r.selectors.includes(".vn-lit"));
	const scopeSets = Object.fromEntries(declarations(scope?.body ?? ""));
	/**
	 * El modelo del vidrio luminoso con los tokens, de abajo arriba: el gris atenuado
	 * por el filtro (`brightness`; a un gris, saturar no le hace nada), la escarcha
	 * (la capa plana, que aquí es un blanco muy tenue en vez de humo) y el brillo
	 * en su punto más fuerte. Cada capa redondea hacia arriba: es una cota.
	 */
	const litUnder = (v: number, grade: string) => overUp(token("lit-sheen")!, overUp(token("lit-frost")!, dimmedUp(grey(Math.min(255, v)), Number(token(`lit-dim-${grade}`)))));

	it("GLASS (glass-contrast.ts) lleva los números de los tokens, uno a uno", () => {
		for (const grade of GRADES) {
			expect(channels(token(`smoke-${grade}`)!), grade).toEqual(GLASS.smoked[grade].smoke);
			expect(Number(token(`lit-dim-${grade}`)), grade).toBe(GLASS.lit[grade].dim);
			expect(token(`lit-ceiling-${grade}`), grade).toBe(GLASS.lit[grade].ceiling);
		}
		expect(channels(token("sheen")!)).toEqual([255, 255, 255, GLASS.sheen.smoked]);
		expect(channels(token("lit-sheen")!)).toEqual([255, 255, 255, GLASS.sheen.lit]);
		expect(channels(token("lit-frost")!)).toEqual([255, 255, 255, GLASS.frost]);
		expect(token("saturate")).toBe(`${GLASS.saturate.smoked * 100}%`);
		expect(token("lit-saturate")).toBe(`${GLASS.saturate.lit * 100}%`);
		expect(token("ink")).toBe(GLASS.ink);
		// Los umbrales son los de esta prueba: el claro sólo lleva íconos (3:1), fino y grueso llevan texto (4.5:1)
		expect(GLASS.threshold).toEqual({ clear: 3, thin: 4.5, thick: 4.5 });
		expect(GLASS.margin).toBe(MARGIN);
	});

	it("la función hace la misma cuenta que esta prueba: sobre un gris, saturar no cambia nada", () => {
		for (const v of [0, 37, 128, 200, 255]) {
			for (const grade of GRADES) {
				// Ahumado: la función redondea hacia arriba y las pruebas de siempre al más cercano; con dos capas, como mucho dos niveles
				const fn = channels(underGlass(grey(v), grade, "smoked"));
				const nearest = channels(over(token("sheen")!, over(token(`smoke-${grade}`)!, grey(v))));
				for (const i of [0, 1, 2]) {
					expect(fn[i], `${grade} ahumado ${v}`).toBeGreaterThanOrEqual(nearest[i]);
					expect(fn[i] - nearest[i], `${grade} ahumado ${v}`).toBeLessThanOrEqual(2);
				}
				expect(underGlass(grey(v), grade, "smoked"), `${grade} ahumado ${v}`).toBe(overUp(token("sheen")!, overUp(token(`smoke-${grade}`)!, grey(v))));
				expect(underGlass(grey(v), grade, "lit"), `${grade} luminoso ${v}`).toBe(litUnder(v, grade));
				expect(glassContrast(grey(v), grade, "lit")).toBeCloseTo(contrast(token("ink")!, underGlass(grey(v), grade, "lit")), 10);
			}
		}
	});

	it.each([
		["clear", 3],
		["thin", 4.5],
		["thick", 4.5],
	] as const)("el techo de %s es la frontera con su holgura: con el fondo 2 niveles más claro que ese gris la tinta aún llega a %s:1, y con el gris siguiente ya no", (grade, min) => {
		const ceiling = channels(token(`lit-ceiling-${grade}`)!)[0];
		expect(token(`lit-ceiling-${grade}`)).toBe(grey(ceiling));
		// La holgura puesta: el techo se cumple aunque lo que hay detrás salga 2 niveles más claro de lo declarado
		expect(contrast(token("ink")!, litUnder(ceiling + MARGIN, grade))).toBeGreaterThanOrEqual(min);
		expect(contrast(token("ink")!, litUnder(ceiling + 1 + MARGIN, grade))).toBeLessThan(min);
		// Así el techo ya no depende de un redondeo: con el gris declarado, lo que queda bajo el texto está al menos un nivel por debajo del límite de la tinta
		const limit = Math.max(...Array.from({ length: 256 }, (_, v) => v).filter((v) => contrast(token("ink")!, grey(v)) >= min));
		expect(limit - channels(litUnder(ceiling, grade))[0]).toBeGreaterThanOrEqual(1);
		// Y es el único salto: por debajo del techo todo pasa, por encima nada
		for (let v = 0; v <= 255; v++) expect(passesOnGlass(grey(v), grade, "lit"), `${grade} ${v}`).toBe(v <= ceiling);
	});

	it("el techo no es un adorno: el vidrio deja pasar fondos más claros que los que aguantaría la tinta sin él, y deja fuera el blanco", () => {
		for (const grade of GRADES) {
			const ceiling = channels(token(`lit-ceiling-${grade}`)!)[0];
			const min = GLASS.threshold[grade];
			// El gris más claro sobre el que la tinta, sin vidrio, llega al umbral (112 para 4.5:1, 142 para 3:1)
			const naked = Math.max(...Array.from({ length: 256 }, (_, v) => v).filter((v) => contrast(token("ink")!, grey(v)) >= min));
			expect(ceiling, grade).toBeGreaterThan(naked);
			expect(ceiling, grade).toBeLessThan(255);
		}
	});

	it("en zona luminosa el vidrio sigue siendo una lámina sobre negro puro: la escarcha la levanta entera y el brillo, arriba", () => {
		// Sólo la escarcha (lo que queda del 40 % para abajo): el doble de luminancia que el suelo de la página
		const body = over(token("lit-frost")!, "#000000");
		expect(luminance(body)).toBeGreaterThan(luminance(token("ground")!) * 2);
		for (const grade of GRADES) expect(contrast(underGlass("#000000", grade, "lit"), "#000000"), grade).toBeGreaterThanOrEqual(1.2);
		// El brillo y la escarcha juntos son el relleno del boceto elegido: de un 16 % de blanco arriba a un 6 %
		const top = 1 - (1 - channels(token("lit-sheen")!)[3]) * (1 - channels(token("lit-frost")!)[3]);
		expect(top).toBeGreaterThanOrEqual(0.15);
		expect(top).toBeLessThanOrEqual(0.16);
		expect(channels(token("lit-frost")!)[3]).toBe(0.06);
	});

	it("el ámbito sólo redefine variables: ninguna regla con vn-lit declara una propiedad", () => {
		expect(litRules.length).toBeGreaterThanOrEqual(2);
		const owned = /(^|[;\s])(background(-color|-image)?|backdrop-filter|-webkit-backdrop-filter|border|border-color|box-shadow)\s*:/;
		for (const r of litRules) {
			expect(r.body, r.selectors.join(", ")).not.toMatch(owned);
			for (const [prop] of declarations(r.body)) expect(prop, r.selectors.join(", ")).toMatch(/^--vn-/);
		}
	});

	it("el ámbito cambia el humo por la escarcha, pone la atenuación de cada grado, sube el brillo y baja la saturación, y nada más", () => {
		expect(scopeSets).toEqual({
			"--vn-smoke-clear": "var(--vn-lit-frost)",
			"--vn-smoke-thin": "var(--vn-lit-frost)",
			"--vn-smoke-thick": "var(--vn-lit-frost)",
			"--vn-dim-clear": "var(--vn-lit-dim-clear)",
			"--vn-dim-thin": "var(--vn-lit-dim-thin)",
			"--vn-dim-thick": "var(--vn-lit-dim-thick)",
			"--vn-sheen": "var(--vn-lit-sheen)",
			"--vn-saturate": "var(--vn-lit-saturate)",
		});
		// Lo que redefine es justo lo que la raíz declara como «valores vivos»: una raíz `.vn` dentro de la zona lo devuelve todo al ahumado
		expect(Object.keys(scopeSets).sort()).toEqual(declarations(liveRule?.[2] ?? "").map(([prop]) => prop).sort());
	});

	it("el ámbito gana a la raíz en el mismo elemento porque glass.css se importa después de tokens.css", () => {
		const entry = read("../styles/ventana.css");
		expect(entry.indexOf("./ventana/tokens.css")).toBeGreaterThan(-1);
		expect(entry.indexOf("./ventana/glass.css")).toBeGreaterThan(entry.indexOf("./ventana/tokens.css"));
		expect(glass).toContain("\n.vn-lit,\n");
		// En tokens.css `vn-lit` sólo aparece en las islas ahumadas, nunca como ámbito
		expect(tokens).not.toMatch(/\n\.vn-lit(,| \{)/);
	});

	it("la barra de navegación es raíz `.vn` ella misma: el ámbito la nombra para alcanzarla, y sólo a ella", () => {
		// `.vn` (una clase) re-declara los valores vivos en la barra; `.vn-lit .vn-nav__bar` (dos) los vuelve a poner luminosos
		expect(scope?.selectors).toEqual([".vn-lit", ".vn-lit .vn-nav__bar"]);
		expect(classCount(".vn-lit .vn-nav__bar")).toBeGreaterThan(classCount(".vn"));
	});

	it("hay islas ahumadas dentro de la zona: toda raíz `.vn`, un vidrio dentro de otro, lo que flota sobre un marco de video y el pulgar del segmentado", () => {
		// Hojas, avisos y paneles en portal llevan la raíz `.vn`; el vidrio anidado no ve el fondo en Chrome (sólo a su
		// padre) y el filtro no lo protegería; el marco enseña el video de una persona, que no controlamos; y el pulgar
		// del segmentado va sobre su riel sólido, no sobre el fondo de la zona: marca la opción elegida igual en todas partes.
		expect(liveSelectors).toEqual([
			".vn",
			".vn-lit .vn-glass .vn-glass",
			// La clase del ámbito puesta en el propio vidrio: lo de dentro también es un vidrio dentro de otro
			".vn-lit.vn-glass .vn-glass",
			".vn-lit .vn-frame",
			".vn-lit .vn-seg",
			// La barra dentro de una raíz `.vn` que alguien puso para dejar ahumada esa parte: el ámbito la nombra, la isla la recupera
			".vn-lit .vn .vn-nav__bar",
		]);
		// El riel es una pieza sólida (pinta su fondo): la isla sólo le cambia variables
		expect(controls).toMatch(/\n\.vn \.vn-seg \{[^}]*background: var\(--vn-surface\);/);
		// El vidrio anidado gana al ámbito aunque sea la propia barra de navegación, y la barra de una isla gana a la del ámbito
		const scopeWeight = Math.max(...scope!.selectors.map(classCount));
		for (const island of [".vn-lit .vn-glass .vn-glass", ".vn-lit.vn-glass .vn-glass", ".vn-lit .vn .vn-nav__bar"]) expect(classCount(island), island).toBeGreaterThan(scopeWeight);
		// Y en una isla el vidrio vuelve a llevar su garantía sobre blanco puro, lo vea o no el filtro
		for (const grade of GRADES) expect(passesOnGlass("#ffffff", grade, "smoked"), grade).toBe(true);
	});

	it("los respaldos ganan dentro de la zona: el mismo sólido, sin filtro", () => {
		const base = glass.indexOf("\n.vn-glass {");
		expect(base).toBeGreaterThan(-1);
		// Misma especificidad que el material (una clase) y más abajo en la hoja: gana el respaldo
		const fallbacks = [...glass.matchAll(/\n\t?(\.vn-glass(?:--solid)?) \{([^}]*)\}/g)].filter((m) => /background: var\(--vn-glass-solid\);/.test(m[2]));
		expect(fallbacks).toHaveLength(4);
		for (const m of fallbacks) {
			expect(m.index!).toBeGreaterThan(base);
			expect(classCount(m[1])).toBe(classCount(".vn-glass"));
			expect(m[2]).toMatch(/(^|\s)backdrop-filter: none;/);
		}
		// El sólido sale de `--vn-glass-solid`, que sólo declaran el material y sus grados y sólo lee los tokens sólidos
		const solidSetters = everyRule.filter((r) => /--vn-glass-solid:/.test(r.body));
		expect(solidSetters.map((r) => r.selectors.join(", ")).sort()).toEqual([".vn-glass", ".vn-glass--clear", ".vn-glass--thick", ".vn-glass--thin"]);
		for (const r of solidSetters) expect(r.body).toMatch(/--vn-glass-solid: var\(--vn-solid-(clear|thin|thick)\);/);
		for (const grade of GRADES) expect(token(`solid-${grade}`)).toMatch(/^#[0-9a-f]{6}$/);
		// Ninguna regla de la zona toca el sólido, el desenfoque, el filete ni la luz del borde: el respaldo es idéntico dentro y fuera
		for (const r of litRules) expect(r.body, r.selectors.join(", ")).not.toMatch(/--vn-(glass-solid|solid-|glass-blur|blur-|rim|glint|glass-rim|glass-shadow|glass-elevation)/);
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

	it("el scrim tiene una meseta: el 40 % pegado al borde garantiza el texto corriente y hasta el 60 % un titular grande", () => {
		const start = glass.indexOf(".vn-scrim {");
		const body = glass.slice(start, glass.indexOf("\n}", start));
		// Las dos direcciones, la misma curva
		expect(body.match(/rgba\(6, 6, 7, 0\.72\) 0%,\s*rgba\(6, 6, 7, 0\.72\) 40%,\s*rgba\(6, 6, 7, 0\.5\) 60%,/g)).toHaveLength(2);
		expect(contrast(token("ink")!, over("rgba(6,6,7,0.72)", "#ffffff"))).toBeGreaterThanOrEqual(4.5);
		// Texto grande (24px o más, o 19px en negrita): 3:1
		expect(contrast(token("ink")!, over("rgba(6,6,7,0.5)", "#ffffff"))).toBeGreaterThanOrEqual(3);
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

	it("la primaria lleva sombra propia: sobre un cuadro claro la cápsula blanca conserva su canto", () => {
		expect(ctl(".vn .vn-btn--primary")).toMatch(/box-shadow:\s*0 1px 2px rgba\(0, 0, 0, 0\.2\),\s*0 4px 14px rgba\(0, 0, 0, 0\.16\);/);
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
	const rules = [...(controls + content + overlays).replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
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
		// La fila del menú pinta su propio resaltado como la del desplegable (nunca lleva vn-glass, hay prueba) y vive dentro del panel de vidrio
		"vn-menu-item",
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
		// Sólo su `::backdrop` (la cortina de la hoja, que no es el vidrio): ninguna otra regla lleva esta clase (hay prueba)
		"vn-sheet-scrim",
		// El enlace de la barra pinta una píldora MÁS OSCURA para la página actual (nunca más clara: bajaría el contraste del texto) y un borde; nunca lleva vn-glass (hay prueba de marcado); la cápsula sí es vidrio
		"vn-nav-link",
		// Piezas sólidas de contenido (Section, Row, Skeleton, Alert, Status, Tabs, Progress, Accordion, Monogram): pintan su fondo, filete o foco; ninguna lleva vn-glass (hay prueba de marcado)
		"vn-section",
		"vn-row",
		"vn-row--action",
		"vn-skel__block",
		"vn-alert",
		"vn-status",
		"vn-tabs__list",
		"vn-tabs__tab",
		"vn-tabs__panel",
		"vn-progress",
		"vn-progress__bar",
		"vn-acc__item",
		"vn-acc__trigger",
		"vn-monogram",
		"vn-monogram--mark",
		// El símbolo de Iris: aro de espectro (en línea, nunca en una hoja) y núcleo; pinta su fondo y nunca lleva vn-glass (hay prueba de marcado)
		"vn-ai",
		"vn-ai__ring",
		"vn-ai__core",
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
		// El filete: la luz del borde (arriba, lados, abajo) salvo que la pieza lo pinte entero con su variable
		expect(body).toMatch(/border: 1px solid;\s*border-color: var\(--vn-glass-rim, var\(--vn-rim-light\)\);/);
		expect(token("rim-light")).toBe("rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.14) rgba(255, 255, 255, 0.22)");
		// La expresión se escribe una sola vez, en una variable que las piezas reutilizan al enfocarse
		expect(body).toMatch(/--vn-glass-elevation: inset 0 1px 0 var\(--vn-glint\), var\(--vn-glass-shadow, 0 1px 2px rgba\(0, 0, 0, 0\.2\), 0 12px 40px rgba\(0, 0, 0, 0\.35\)\);/);
		expect(body).toMatch(/box-shadow: var\(--vn-glass-elevation\);/);
		expect(body).not.toMatch(/--vn-glass-(fill|smoke-alpha)/);
	});

	it("los botones de vidrio ajustan la sombra y, con puntero fino, el filete, sólo por variable", () => {
		const shadow = rules.find((r) => r.selectors.includes(".vn .vn-btn.vn-glass") && /--vn-glass-shadow:/.test(r.body));
		expect(shadow).toBeTruthy();
		const hover = rules.find((r) => r.selectors.includes(".vn .vn-btn.vn-glass:hover"));
		expect(hover?.body).toMatch(/--vn-glass-rim: var\(--vn-rim-top\);/);
		expect(controls.indexOf(".vn .vn-btn.vn-glass:hover")).toBeGreaterThan(controls.indexOf("@media (hover: hover) and (pointer: fine)"));
	});

	it("sobre vidrio el foco va en outline y la sombra del material se queda, con un aro oscuro para los fondos claros", () => {
		const glassFocus = rules.filter((r) => r.selectors.some((sel) => /vn-glass.*:focus-visible|vn-chip--glass.*:focus-visible/.test(sel)));
		expect(glassFocus.length).toBeGreaterThanOrEqual(2);
		expect(glassFocus.flatMap((r) => r.selectors)).toEqual(
			expect.arrayContaining([".vn .vn-btn.vn-glass:focus-visible", ".vn button.vn-chip--action.vn-glass:focus-visible", ".vn .vn-chip--glass.vn-chip--split:has(.vn-chip__main:focus-visible)"]),
		);
		for (const r of glassFocus) {
			expect(r.body, r.selectors.join(", ")).toMatch(/outline: 2px solid var\(--vn-ink\);/);
			expect(r.body, r.selectors.join(", ")).toMatch(/outline-offset: 2px;/);
			expect(r.body, r.selectors.join(", ")).toMatch(/box-shadow: var\(--vn-glass-elevation\), 0 0 0 2px var\(--vn-ground\);/);
			expect(r.body, r.selectors.join(", ")).not.toMatch(/var\(--vn-focus\)/);
		}
		// El aro oscuro se ve contra blanco puro y el de tinta contra negro puro
		expect(contrast(token("ground")!, "#ffffff")).toBeGreaterThanOrEqual(3);
		expect(contrast(token("ink")!, "#000000")).toBeGreaterThanOrEqual(3);
	});

	it("la cuenta del campo ocupa la caja de la etiqueta: al aparecer no mueve la cabecera", () => {
		const count = ctl(".vn .vn-field__count");
		expect(count).toMatch(/font-size: 0\.75rem;/);
		expect(count).toMatch(/line-height: 1;/);
		expect(count).toMatch(/font-variant-numeric: tabular-nums;/);
		expect(rule(".vn .vn-label")).toMatch(/font-size: 0\.75rem;[\s\S]*line-height: 1;/);
	});

	it("en la fila resaltada del desplegable la pista pasa a tinta, y la tinta se lee ahí con blanco puro detrás", () => {
		expect(ctl(".vn .vn-select-item[data-highlighted] .vn-select-hint")).toMatch(/color: var\(--vn-ink\);/);
		const highlighted = over(token("hair")!, over(token("sheen")!, over(token("smoke-thick")!, "#ffffff")));
		expect(contrast(token("ink")!, highlighted)).toBeGreaterThanOrEqual(4.5);
	});

	it("las filas del desplegable y del menú llevan el radio concéntrico: el del panel menos su margen", () => {
		expect(ctl(".vn .vn-select-viewport")).toMatch(/padding: 6px;/);
		expect(ctl(".vn .vn-select-item")).toMatch(/border-radius: calc\(var\(--vn-r-panel\) - 6px\);/);
		const bodyOf = (selector: string) => overlays.split(`\n${selector} {`)[1]?.split("}")[0] ?? "";
		expect(bodyOf(".vn .vn-menu")).toMatch(/padding: 6px;/);
		expect(bodyOf(".vn .vn-menu-item")).toMatch(/border-radius: calc\(var\(--vn-r-panel\) - 6px\);/);
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

	it("la etiqueta de la casilla va en tinta primaria", () => {
		expect(ctl(".vn .vn-check__text")).toMatch(/color: var\(--vn-ink\);/);
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

	it("las piezas sólidas de contenido no tienen desenfoque y content.css sigue sin backdrop-filter", () => {
		expect(content).not.toMatch(/backdrop-filter/);
		const own = rules.filter((r) => r.selectors.some((sel) => /vn-(section|row|skel|alert|status|tabs|progress|acc|monogram)/.test(sel)));
		expect(own.length).toBeGreaterThan(20);
		for (const r of own) {
			expect(r.body, r.selectors.join(", ")).not.toMatch(/backdrop-filter/);
			expect(r.selectors.join(", ")).not.toMatch(/vn-glass/);
		}
	});

	it("el aviso y el estado se pintan sobre surface: el danger (letra) y la tinta secundaria pasan AA ahí", () => {
		expect(cnt(".vn .vn-alert")).toMatch(/background: var\(--vn-surface\);/);
		expect(cnt(".vn .vn-alert")).toMatch(/color: var\(--vn-danger\);/);
		expect(cnt(".vn .vn-status")).toMatch(/background: var\(--vn-surface\);/);
		expect(contrast(token("danger")!, token("surface")!)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("danger")!, token("ground")!)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("ink-2")!, token("surface")!)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("ink-2")!, token("raised")!)).toBeGreaterThanOrEqual(4.5);
	});

	it("las pestañas marcan la elegida con tinta plena y raya de 2px; las demás en tinta 2", () => {
		expect(cnt(".vn .vn-tabs__tab")).toMatch(/color: var\(--vn-ink-2\);/);
		expect(cnt(".vn .vn-tabs__tab[data-state=\"active\"]")).toMatch(/color: var\(--vn-ink\);/);
		expect(cnt(".vn .vn-tabs__tab::after")).toMatch(/block-size: 2px;[\s\S]*background: var\(--vn-ink\);/);
		// El filete de la lista es una sombra interior (dentro de la caja de relleno) y la raya queda pegada al borde inferior
		expect(cnt(".vn .vn-tabs__list")).toMatch(/box-shadow: inset 0 -1px 0 var\(--vn-hair\);/);
		expect(cnt(".vn .vn-tabs__list")).not.toMatch(/border/);
		expect(cnt(".vn .vn-tabs__tab::after")).toMatch(/inset-block-end: 0;/);
	});

	it("el foco de la pestaña es un anillo interior y ninguna regla de una lista con desplazamiento usa uno exterior", () => {
		const focus = cnt(".vn .vn-tabs__tab:focus-visible");
		expect(focus).toMatch(/box-shadow: inset 0 0 0 2px var\(--vn-ink\);/);
		expect(focus).not.toMatch(/var\(--vn-focus\)/);
		expect(cnt(".vn .vn-tabs__list")).toMatch(/overflow-x: auto;/);
		for (const r of rules.filter((x) => x.selectors.some((sel) => /vn-tabs__tab/.test(sel) && sel.includes(":focus-visible")))) {
			expect(r.body, r.selectors.join(", ")).not.toMatch(/var\(--vn-focus\)/);
		}
		// transform-origin sólo admite palabras físicas: base a la izquierda y, en RTL, a la derecha
		expect(cnt(".vn .vn-progress__bar")).toMatch(/transform-origin: left center;/);
		const rtl = rules.find((r) => r.selectors.some((sel) => sel.includes('[dir="rtl"]') && sel.includes("vn-progress__bar")));
		expect(rtl?.body).toMatch(/transform-origin: right center;/);
	});

	it("el filete danger del aviso y del estado llega a 3:1 contra surface", () => {
		expect(cnt(".vn .vn-alert")).toMatch(/border: 1px solid var\(--vn-danger\);/);
		expect(cnt('.vn .vn-status[data-tone="alert"]')).toMatch(/border-color: var\(--vn-danger\);/);
		expect(contrast(token("danger")!, token("surface")!)).toBeGreaterThanOrEqual(3);
	});

	it("la fila mide 44px, rellena con surface al enfocar y al pasar el puntero fino", () => {
		expect(cnt(".vn .vn-row")).toMatch(/min-block-size: 44px;/);
		expect(cnt(".vn .vn-row--action:focus-visible")).toMatch(/background: var\(--vn-surface\);/);
		const media = content.slice(content.indexOf("@media (hover: hover) and (pointer: fine)"));
		expect(media).toMatch(/\.vn-row--action:hover/);
		expect(content.match(/:hover/g)?.length).toBe(media.match(/:hover/g)?.length);
	});

	it("esqueleto, progreso y acordeón no animan nada con movimiento reducido", () => {
		const reduced = content.slice(content.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
		expect(reduced).toMatch(/\.vn-skel__block \{\s*animation: none;/);
		expect(reduced).toMatch(/\.vn-progress__bar,[\s\S]*transition: none;/);
		expect(reduced).toMatch(/\.vn-acc__content\[data-state="open"\],[\s\S]*animation: none;/);
		expect(cnt(".vn .vn-progress__bar")).toMatch(/scale: var\(--vn-progress, 0\) 1;/);
		expect(content).toMatch(/--radix-accordion-content-height/);
	});
});

describe("Ventana CSS: transform-origin", () => {
	it("ninguna hoja declara transform-origin con una palabra lógica (la propiedad no las admite)", () => {
		const logical = /transform-origin:[^;]*\b(inline-start|inline-end|block-start|block-end)\b/;
		expect(allVentanaCss.length).toBeGreaterThan(5);
		for (const css of allVentanaCss) expect(css).not.toMatch(logical);
		expect("transform-origin: inline-start center;").toMatch(logical);
	});
});

describe("Ventana flotantes: menú, popover y tooltip", () => {
	const ovlRules = [...overlays.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
		selectors: m[1].split(",").map((x) => x.trim()),
		body: m[2],
	}));
	/** Cuerpo de la regla que incluye `selector` entre sus selectores (también las de selector compuesto). */
	const ovl = (selector: string) => ovlRules.find((r) => r.selectors.includes(selector))?.body ?? "";
	const ownedByGlass = /(^|[;\s])(background(-color|-image)?|backdrop-filter|-webkit-backdrop-filter|border|border-color|box-shadow)\s*:/;
	const thickBehind = () => over(token("sheen")!, over(token("smoke-thick")!, "#ffffff"));
	const highlighted = () => over(token("hair")!, thickBehind());

	it("overlays.css entra por ventana.css y por la lista de todo el CSS de Ventana", () => {
		expect(read("../styles/ventana.css")).toMatch(/@import "\.\/ventana\/overlays\.css";/);
		expect(allVentanaCss.some((css) => css.includes(".vn-tooltip"))).toBe(true);
	});

	it("los paneles son vidrio: sus reglas sólo ajustan el material por variable", () => {
		const panels = ovlRules.filter((r) => r.selectors.some((sel) => /vn-(menu|popover|tooltip)(-(panel|sep|hint|icon|label))?\b/.test(sel) && !/vn-menu-item/.test(sel)));
		expect(panels.length).toBeGreaterThan(5);
		for (const r of panels) expect(r.body, r.selectors.join(", ")).not.toMatch(ownedByGlass);
		expect(ovl(".vn .vn-menu")).toMatch(/--vn-glass-r: var\(--vn-r-panel\);/);
		expect(ovl(".vn .vn-popover")).toMatch(/--vn-glass-r: var\(--vn-r-panel\);/);
		expect(ovl(".vn .vn-tooltip")).toMatch(/--vn-glass-r: var\(--vn-r-thumb\);/);
		for (const sel of [".vn .vn-menu", ".vn .vn-popover", ".vn .vn-tooltip"]) expect(ovl(sel), sel).toMatch(/--vn-glass-shadow:/);
	});

	it("entran desde su disparador con el resorte y salen en 120ms con la curva de salida", () => {
		expect(ovl(".vn .vn-menu")).toMatch(/transform-origin: var\(--radix-dropdown-menu-content-transform-origin\);/);
		expect(ovl(".vn .vn-popover")).toMatch(/transform-origin: var\(--radix-popover-content-transform-origin\);/);
		expect(ovl(".vn .vn-tooltip")).toMatch(/transform-origin: var\(--radix-tooltip-content-transform-origin\);/);
		expect(overlays).toMatch(/animation: vn-overlay-in var\(--vn-spring-snap-ms\) var\(--vn-spring-snap\)/);
		expect(overlays).toMatch(/animation: vn-overlay-out 120ms var\(--vn-ease-out\) forwards/);
		// En movimiento reducido: sólo opacidad, de entrada y de salida
		// El bloque de los flotantes de Radix (el de la hoja tiene el suyo y sí lleva translate y scale)
		const from = overlays.indexOf("/* Movimiento reducido: sólo opacidad, de entrada y de salida */");
		const reduced = overlays.slice(from, overlays.indexOf("@media (prefers-contrast: more)", from));
		expect(reduced).toMatch(/vn-overlay-fade-in/);
		expect(reduced).toMatch(/vn-overlay-fade-out/);
		expect(reduced).not.toMatch(/scale|translate/);
	});

	it("el tooltip no repite la animación cuando abre sin espera tras otro", () => {
		expect(overlays).toMatch(/\.vn-tooltip\[data-state="instant-open"\] \{[^}]*animation: none;/);
	});

	it("la fila del menú: tinta primaria, 44px, resaltado con hair y toda su letra en tinta al resaltarse", () => {
		expect(ovl(".vn .vn-menu-item")).toMatch(/color: var\(--vn-ink\);/);
		expect(ovl(".vn .vn-menu-item")).toMatch(/min-block-size: 44px;/);
		expect(ovl(".vn .vn-menu-item[data-highlighted]")).toMatch(/background: var\(--vn-hair\);/);
		expect(ovl(".vn .vn-menu-hint")).toMatch(/color: var\(--vn-ink-2-glass\);/);
		expect(ovl(".vn .vn-menu-item[data-highlighted] .vn-menu-hint")).toMatch(/color: var\(--vn-ink\);/);
		expect(ovl(".vn .vn-menu-item--danger")).toMatch(/color: var\(--vn-danger-glass\);/);
		expect(ovl(".vn .vn-menu-item--danger[data-highlighted]")).toMatch(/color: var\(--vn-ink\);/);
		expect(ovl(".vn .vn-menu-item[data-highlighted] .vn-menu-icon")).toMatch(/color: var\(--vn-ink\);/);
	});

	it("en un menú con iconos la fila sin icono guarda su hueco: las etiquetas empiezan en la misma vertical", () => {
		// 12px de relleno + 18px de icono + 10px de separación
		expect(ovl(".vn .vn-menu-item")).toMatch(/gap: 10px;[\s\S]*padding: 10px 12px;/);
		expect(ovl(".vn .vn-menu-icon > svg")).toMatch(/inline-size: 18px;/);
		expect(ovl(".vn .vn-menu:has(.vn-menu-icon) .vn-menu-item:not(:has(.vn-menu-icon))")).toMatch(/padding-inline-start: 40px;/);
	});

	it("la tinta sobre una fila resaltada del vidrio grueso, con blanco puro detrás, pasa AA", () => {
		expect(contrast(token("ink")!, highlighted())).toBeGreaterThanOrEqual(4.5);
	});

	it("el texto secundario del menú, sin resaltar, pasa AA sobre el vidrio grueso", () => {
		expect(contrast(token("ink-2-glass")!, thickBehind())).toBeGreaterThanOrEqual(4.5);
	});

	it("el ítem peligroso se lee sobre su sólido de respaldo", () => {
		expect(contrast(token("danger")!, token("solid-thick")!)).toBeGreaterThanOrEqual(4.5);
	});

	it("el peligro para texto sobre vidrio grueso tiene su propio color y llega a 4.5:1 con blanco puro detrás", () => {
		expect(contrast(token("danger-glass")!, thickBehind())).toBeGreaterThanOrEqual(4.5);
		expect(ovl(".vn .vn-menu-item--danger")).toMatch(/color: var\(--vn-danger-glass\);/);
		expect(ovl(".vn .vn-menu-item--danger .vn-menu-icon")).toMatch(/color: var\(--vn-danger-glass\);/);
	});

	it("el icono peligroso sigue en danger-glass al resaltarse y llega a 3:1 sobre la fila resaltada; el texto resaltado va en tinta", () => {
		expect(ovl(".vn .vn-menu-item--danger[data-highlighted] .vn-menu-icon")).toMatch(/color: var\(--vn-danger-glass\);/);
		expect(ovl(".vn .vn-menu-item--danger[data-highlighted]")).toMatch(/color: var\(--vn-ink\);/);
		expect(contrast(token("danger-glass")!, highlighted())).toBeGreaterThanOrEqual(3);
		// --vn-danger (el sólido) sigue valiendo para el icono sobre vidrio grueso: 3:1
		expect(contrast(token("danger")!, thickBehind())).toBeGreaterThanOrEqual(3);
	});

	it("el texto del tooltip va en tinta primaria con el tamaño pequeño, nunca en tinta secundaria", () => {
		const body = ovl(".vn .vn-tooltip");
		expect(body).toMatch(/color: var\(--vn-ink\);/);
		expect(body).toMatch(/font-size: 0\.8125rem;/);
		expect(overlays).not.toMatch(/\.vn-tooltip[^{]*\{[^}]*--vn-ink-[23]/);
	});

	it("ningún texto de los flotantes baja de 0.75rem", () => {
		const sizes = [...overlays.matchAll(/font-size: ([\d.]+)rem/g)].map((m) => Number(m[1]));
		expect(sizes.length).toBeGreaterThan(0);
		for (const size of sizes) expect(size).toBeGreaterThanOrEqual(0.75);
	});
});

describe("Ventana hoja y avisos", () => {
	const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
	const rulesOf = (css: string) => [...strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(",").map((x) => x.trim()), body: m[2] }));
	const all = rulesOf(overlays);
	const ownedByGlass = /(^|[;\s])(background(-color|-image)?|backdrop-filter|-webkit-backdrop-filter|border|border-color|box-shadow)\s*:/;
	const rule = (selector: string) => all.find((r) => r.selectors.includes(selector))?.body ?? "";
	const thickBehind = () => over(token("sheen")!, over(token("smoke-thick")!, "#ffffff"));

	it("las reglas de la hoja y del aviso no declaran lo que posee el vidrio", () => {
		const mine = all.filter((r) => r.selectors.some((s) => /vn-(sheet|toast)/.test(s) && !/vn-sheet-scrim/.test(s)));
		expect(mine.length).toBeGreaterThan(8);
		// Única excepción: la sombra de foco del aviso devuelve la del material por su variable compartida
		for (const r of mine) expect(r.body.replace(/box-shadow: var\(--vn-glass-elevation\), 0 0 0 2px var\(--vn-ground\);/, ""), r.selectors.join(", ")).not.toMatch(ownedByGlass);
	});

	it("vn-sheet-scrim sólo sale en reglas de ::backdrop y la cortina es un literal rgba(0, 0, 0, 0.5)", () => {
		// En todas las hojas de Ventana, no sólo en overlays.css
		const scrim = allVentanaCss.flatMap(rulesOf).filter((r) => r.selectors.some((s) => s.includes("vn-sheet-scrim")));
		expect(scrim.length).toBeGreaterThan(0);
		for (const r of scrim) for (const s of r.selectors) expect(s, s).toMatch(/::backdrop$/);
		expect(rule(".vn-sheet-scrim::backdrop")).toMatch(/background: rgba\(0, 0, 0, 0\.5\);/);
	});

	it("la hoja ajusta el material por variable: radio de hoja y sombra mayor", () => {
		const body = rule(".vn.vn-sheet");
		expect(body).toMatch(/--vn-glass-r: var\(--vn-r-sheet\);/);
		expect(body).toMatch(/--vn-glass-shadow:/);
	});

	it("bajo 40rem es una hoja pegada abajo con esquinas inferiores rectas y área segura; desde 40rem, centrada", () => {
		const body = rule(".vn.vn-sheet");
		expect(body).toMatch(/margin-block: auto 0;/);
		expect(body).toMatch(/border-end-start-radius: 0;/);
		expect(body).toMatch(/border-end-end-radius: 0;/);
		expect(overlays).toMatch(/env\(safe-area-inset-bottom, 0px\)/);
		const wide = overlays.slice(overlays.indexOf("@media (min-width: 40rem)"));
		expect(wide).toMatch(/max-inline-size: 32rem/);
		expect(wide).toMatch(/scale: 0\.96;/);
	});

	it("el pie de la hoja pone las acciones en fila con aire: repartidas en el teléfono, a la derecha desde 40rem", () => {
		const foot = rule(".vn .vn-sheet__foot");
		expect(foot).toMatch(/display: flex;/);
		expect(foot).toMatch(/gap: 8px;/);
		expect(rule(".vn .vn-sheet__foot > .vn-btn")).toMatch(/flex: 1 1 auto;/);
		const wide = overlays.slice(overlays.indexOf("@media (min-width: 40rem)"));
		expect(wide).toMatch(/\.vn-sheet__foot \{\s*justify-content: flex-end;/);
		expect(wide).toMatch(/\.vn-sheet__foot > \.vn-btn \{\s*flex: none;/);
	});

	it("entra y sale sin JavaScript: @starting-style y transition-behavior allow-discrete en display y overlay", () => {
		expect(overlays).toMatch(/@starting-style/);
		const body = rule(".vn.vn-sheet");
		expect(body).toMatch(/transition-behavior: allow-discrete;/);
		expect(body).toMatch(/overlay [^,;]*allow-discrete/);
		expect(body).toMatch(/display [^,;]*allow-discrete/);
		expect(rule(".vn.vn-sheet[open]")).toMatch(/translate var\(--vn-spring-soft-ms\) var\(--vn-spring-soft\)/);
	});

	it("con movimiento reducido la hoja sólo cambia de opacidad", () => {
		const reduced = overlays.slice(overlays.indexOf("@media (prefers-reduced-motion: reduce)", overlays.indexOf("Hoja (`Sheet`)")));
		expect(reduced.slice(0, reduced.indexOf("@starting-style"))).toMatch(/\.vn\.vn-sheet/);
		expect(reduced).toMatch(/translate: none;/);
		expect(reduced).toMatch(/scale: none;/);
	});

	it("el texto de la hoja: título en tinta, descripción en tinta secundaria de vidrio, que pasa 4.5:1 sobre el vidrio grueso", () => {
		expect(rule(".vn .vn-sheet__title")).toMatch(/color: var\(--vn-ink\);/);
		expect(rule(".vn .vn-sheet__desc")).toMatch(/color: var\(--vn-ink-2-glass\);/);
		expect(contrast(token("ink-2-glass")!, thickBehind())).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("ink")!, thickBehind())).toBeGreaterThanOrEqual(4.5);
	});

	it("los avisos: título en tinta, descripción en tinta secundaria de vidrio (con la especificidad que gana al tema oscuro de sonner) e icono de error en danger-glass", () => {
		expect(rule(".vn-toast .vn-toast__title")).toMatch(/color: var\(--vn-ink\);/);
		const desc = all.find((r) => r.selectors.some((s) => s.includes(".vn-toast__desc") && s.startsWith("[data-sonner-toaster][data-sonner-theme]")));
		expect(desc?.body).toMatch(/color: var\(--vn-ink-2-glass\);/);
		expect(rule('.vn-toast[data-type="error"] .vn-toast__icon')).toMatch(/color: var\(--vn-danger-glass\);/);
		expect(contrast(token("danger-glass")!, thickBehind())).toBeGreaterThanOrEqual(3);
	});

	it("el aviso es vidrio por variable, con el anillo de foco en outline", () => {
		expect(rule(".vn.vn-toast")).toMatch(/--vn-glass-r: var\(--vn-r-panel\);/);
		expect(rule(".vn.vn-toast")).toMatch(/--vn-glass-shadow:/);
		expect(rule(".vn.vn-toast:focus-visible")).toMatch(/outline: 2px solid var\(--vn-ink\);/);
	});

	it("el aviso bajo unstyled: icono relative con el svg de 1rem, cargador con sus fotogramas, atrás de la pila sin texto y foco con la sombra del material", () => {
		expect(rule(".vn-toast .vn-toast__icon")).toMatch(/position: relative;/);
		expect(rule(".vn-toast .vn-toast__icon svg")).toMatch(/inline-size: 1rem;/);
		expect(rule(".vn-toast .vn-toast__icon .vn-toast__spin")).toMatch(/animation: vn-toast-spin /);
		expect(overlays).toMatch(/@keyframes vn-toast-spin/);
		const reduced = overlays.slice(overlays.indexOf("@media (prefers-reduced-motion: reduce)", overlays.indexOf("Hoja (`Sheet`)")));
		expect(reduced.slice(0, reduced.indexOf(".vn.vn-sheet"))).toMatch(/\.vn-toast__spin \{\s*animation: none;/);
		expect(rule('.vn-toast[data-expanded="false"][data-front="false"] > *')).toMatch(/opacity: 0;/);
		expect(rule(".vn.vn-toast:focus-visible")).toMatch(/box-shadow: var\(--vn-glass-elevation\), 0 0 0 2px var\(--vn-ground\);/);
	});
});

describe("Ventana barra de navegación", () => {
	const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
	const rulesOf = (css: string) => [...strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(",").map((x) => x.trim()), body: m[2] }));
	const all = rulesOf(overlays);
	const ownedByGlass = /(^|[;\s])(background(-color|-image)?|backdrop-filter|-webkit-backdrop-filter|border|border-color|box-shadow)\s*:/;
	const rule = (selector: string) => all.find((r) => r.selectors.includes(selector))?.body ?? "";
	const thinBehind = () => over(token("sheen")!, over(token("smoke-thin")!, "#ffffff"));
	const thickBehind = () => over(token("sheen")!, over(token("smoke-thick")!, "#ffffff"));

	it("las reglas de la barra y de su hoja no declaran lo que posee el vidrio", () => {
		// El enlace (vn-nav-link) es sólido por diseño: va en SOLID_PIECES y se prueba aparte
		const mine = all.filter((r) => r.selectors.some((s) => /vn-nav/.test(s)) && !r.selectors.some((s) => /vn-nav-link/.test(s)));
		expect(mine.length).toBeGreaterThan(10);
		for (const r of mine) expect(r.body, r.selectors.join(", ")).not.toMatch(ownedByGlass);
	});

	it("el enlace va en tinta entera sin opacidad: el 78 % no llega a 4.5:1, la tinta sí, sobre vidrio fino y sobre el grueso del modo compacto", () => {
		expect(rule(".vn .vn-nav-link")).toContain("color: var(--vn-ink);");
		expect(rule(".vn .vn-nav-link")).not.toContain("opacity");
		// El «78 %» del brief no pasa: se deja constancia de por qué no se tomó al pie de la letra
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(token("ink")!.slice(i, i + 2), 16));
		const ink78 = over(`rgba(${r}, ${g}, ${b}, 0.78)`, thinBehind());
		expect(contrast(ink78, thinBehind())).toBeLessThan(4.5);
		expect(contrast(token("ink")!, thinBehind())).toBeGreaterThanOrEqual(4.5);
		expect(contrast(token("ink")!, thickBehind())).toBeGreaterThanOrEqual(4.5);
		expect(token("ink-nav")).toBeUndefined();
	});

	it("la página actual lleva una píldora más oscura con borde, que sube el contraste de la tinta, y peso 600", () => {
		const current = rule('.vn .vn-nav-link[aria-current="page"]');
		expect(current).toContain("background-color: rgba(6, 6, 7, 0.32);");
		expect(current).toContain("box-shadow: inset 0 0 0 1px var(--vn-line);");
		expect(current).toContain("font-weight: 600;");
		const pill = "rgba(6, 6, 7, 0.32)";
		expect(contrast(token("ink")!, over(pill, thinBehind()))).toBeGreaterThan(contrast(token("ink")!, thinBehind()));
		expect(contrast(token("ink")!, over(pill, thickBehind()))).toBeGreaterThan(contrast(token("ink")!, thickBehind()));
	});

	it("hover (sólo con puntero fino) y foco marcan el borde, no el relleno; el foco además lleva su anillo", () => {
		const media = overlays.indexOf("@media (hover: hover) and (pointer: fine) {\n\t.vn .vn-nav-link:hover {");
		expect(media).toBeGreaterThan(0);
		expect(overlays.slice(media, media + 160)).toContain("box-shadow: inset 0 0 0 1px var(--vn-line);");
		// Fuera de ese @media no hay regla :hover del enlace
		expect(overlays.split(".vn .vn-nav-link:hover").length - 1).toBe(1);
		const focus = rule(".vn .vn-nav-link:focus-visible");
		expect(focus).toContain("box-shadow: inset 0 0 0 1px var(--vn-line);");
		expect(focus).toContain("outline: 2px solid var(--vn-ink);");
		expect(focus).not.toContain("background");
		// El reposo reserva el borde transparente: el cambio sólo anima y no mueve nada
		expect(rule(".vn .vn-nav-link")).toContain("box-shadow: inset 0 0 0 1px transparent;");
		expect(rule(".vn .vn-nav-link")).toContain("var(--vn-ease-out)");
	});

	it("el enlace mide 36px (44px en la hoja) y su área de toque llega a 44px con un pseudoelemento, así que no desborda la barra compacta", () => {
		expect(rule(".vn .vn-nav-link")).toContain("--vn-link-h: 36px;");
		expect(rule(".vn .vn-nav-link")).toContain("block-size: var(--vn-link-h);");
		expect(rule(".vn .vn-nav-link::after")).toContain("inset-block: calc((44px - var(--vn-link-h)) / -2);");
		expect(rule(".vn .vn-nav__links--stack .vn-nav-link")).toContain("--vn-link-h: 44px;");
	});

	it("la cápsula: radio de píldora por variable, 52px y 44px compacta con el resorte rápido, sin transicionar el material", () => {
		const bar = rule(".vn.vn-nav__bar");
		expect(bar).toMatch(/--vn-glass-r: var\(--vn-r-pill\);/);
		expect(bar).toMatch(/--vn-nav-h: 52px;/);
		expect(bar).toMatch(/block-size: var\(--vn-nav-h\);/);
		expect(bar).toMatch(/transition: block-size var\(--vn-spring-snap-ms\) var\(--vn-spring-snap\);/);
		expect(rule(".vn.vn-nav__bar[data-compact]")).toMatch(/--vn-nav-h: 44px;/);
		// El header no se posiciona: eso es del consumidor
		expect(rule(".vn-nav")).not.toMatch(/position:/);
	});

	it("la hoja del menú: vidrio por variable, pegada arriba con 12px de margen y el resorte suave; la cortina es la de la hoja", () => {
		const body = rule(".vn.vn-nav-sheet");
		expect(body).toMatch(/--vn-glass-r: var\(--vn-r-sheet\);/);
		expect(body).toMatch(/inset-block: 0 auto;/);
		expect(body).toMatch(/12px/);
		expect(rule(".vn.vn-nav-sheet[open]")).toMatch(/translate var\(--vn-spring-soft-ms\) var\(--vn-spring-soft\)/);
		expect(overlays).toMatch(/@starting-style \{\s*\.vn\.vn-nav-sheet\[open\]/);
		expect(rule(".vn-sheet-scrim::backdrop")).toMatch(/background: rgba\(0, 0, 0, 0\.5\);/);
		expect(overlays).not.toMatch(/vn-nav-scrim/);
	});

	it("con movimiento reducido la barra y la hoja sólo cambian de opacidad", () => {
		// El bloque @media completo, hallado por sus llaves (no por un número fijo de caracteres)
		const inner = overlays.indexOf(".vn.vn-nav__bar {\n\t\ttransition: none;");
		const start = overlays.lastIndexOf("@media (prefers-reduced-motion: reduce) {", inner);
		expect(inner).toBeGreaterThan(0);
		expect(start).toBeGreaterThan(0);
		let depth = 0;
		let end = -1;
		for (let i = overlays.indexOf("{", start); i < overlays.length; i++) {
			if (overlays[i] === "{") depth++;
			if (overlays[i] === "}" && --depth === 0) {
				end = i;
				break;
			}
		}
		expect(end).toBeGreaterThan(inner);
		const reduced = overlays.slice(start, end + 1);
		expect(reduced).toMatch(/\.vn\.vn-nav-sheet\[open\] \{\s*translate: none;/);
		expect(reduced).toMatch(/opacity 150ms linear/);
		expect(reduced).toMatch(/@starting-style \{\s*\.vn\.vn-nav-sheet\[open\] \{\s*translate: none;/);
	});
});

describe("Ventana: las marcas", () => {
	it("el espectro es sólo de Iris: ninguna hoja de Ventana contiene uno de sus colores", () => {
		const css = allVentanaCss.join("\n").toLowerCase();
		for (const c of AI_SPECTRUM) expect(css, c).not.toContain(c);
		expect(css).not.toContain("conic-gradient");
	});

	it("el aro de Iris se pinta con la variable en línea, se enmascara a aro y deja de girar con movimiento reducido", () => {
		expect(content).toMatch(/\.vn \.vn-ai__ring \{[^}]*background: var\(--vn-ai-spectrum\);[^}]*mask: radial-gradient/);
		expect(content).toMatch(/\.vn-ai--thinking \.vn-ai__ring \{\s*animation: vn-ai-spin 3s linear infinite;/);
		const reduced = content.slice(content.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
		expect(reduced).toMatch(/\.vn-ai--thinking \.vn-ai__ring \{\s*animation: none;/);
	});

	it("el logotipo usa 650, −0.02em y 44px de alto", () => {
		const body = content.match(/\n\.vn \.vn-wordmark \{([^}]*)\}/)?.[1] ?? "";
		expect(body).toMatch(/font-weight: 650;/);
		expect(body).toMatch(/letter-spacing: -0\.02em;/);
		expect(body).toMatch(/min-block-size: 44px;/);
	});
});

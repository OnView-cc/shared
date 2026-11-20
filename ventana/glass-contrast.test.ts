/**
 * La cuenta del contraste sobre vidrio (`glass-contrast.ts`): la garantía del
 * ahumado dicha con la función, los techos del luminoso como frontera exacta
 * (con su holgura), que la cuenta es una cota y no una simulación (redondea
 * hacia arriba y no recorta entre los pasos del filtro), y dos colores de una
 * marca que enseñan qué es un fondo «que controlamos».
 * Que los números de `GLASS` sean los de los tokens lo comprueba
 * `tests/ventana-tokens.test.ts` (aquí no se lee CSS).
 */
import { describe, expect, it } from "vitest";
import { GLASS, glassContrast, passesOnGlass, underGlass, type GlassGrade } from "./glass-contrast";

const GRADES: GlassGrade[] = ["clear", "thin", "thick"];

/** Un gris neutro de 0 a 255 como hex. */
const grey = (v: number) => "#" + v.toString(16).padStart(2, "0").repeat(3);
const level = (hex: string) => parseInt(hex.slice(1, 3), 16);

describe("vidrio ahumado: la garantía es sobre blanco puro", () => {
	it("con blanco puro detrás, bajo el vidrio queda la cuenta de la prueba de tokens redondeada hacia arriba", () => {
		// Fino: humo rgba(44,44,50,0.74) sobre #ffffff = (98.86, 98.86, 103.3) → (99, 99, 104);
		// brillo 6 % encima = (108.36, 108.36, 113.06) → (109, 109, 114). La prueba de tokens, que
		// redondea al más cercano, da (108, 108, 112): esta cota nunca queda por debajo.
		expect(underGlass("#ffffff", "thin", "smoked")).toBe("#6d6d72");
		expect(underGlass("#ffffff", "clear", "smoked")).toBe("#89898d");
		expect(underGlass("#ffffff", "thick", "smoked")).toBe("#505053");
	});

	it.each(GRADES)("%s deja leer la tinta sobre blanco puro", (grade) => {
		expect(glassContrast("#ffffff", grade, "smoked")).toBeGreaterThanOrEqual(GLASS.threshold[grade]);
		expect(passesOnGlass("#ffffff", grade, "smoked")).toBe(true);
	});

	it("y por tanto sobre cualquier color: ninguno queda más claro que el blanco bajo el humo", () => {
		for (const backdrop of ["#000000", "#808080", "#c2410c", "#f5ead8", "#ffff00", "#00ffff", "#ff0000", "#ff00ff"]) {
			for (const grade of GRADES) {
				expect(passesOnGlass(backdrop, grade, "smoked"), `${backdrop} ${grade}`).toBe(true);
				expect(glassContrast(backdrop, grade, "smoked"), `${backdrop} ${grade}`).toBeGreaterThanOrEqual(glassContrast("#ffffff", grade, "smoked"));
			}
		}
	});
});

describe("vidrio luminoso: la garantía es sobre un techo declarado", () => {
	it("la holgura son 2 niveles: lo que Chrome midió de más sobre la cuenta", () => {
		expect(GLASS.margin).toBe(2);
	});

	it.each(GRADES)("%s: el techo pasa y el gris siguiente ya no", (grade) => {
		const ceiling = GLASS.lit[grade].ceiling;
		expect(ceiling).toMatch(/^#([0-9a-f]{2})\1\1$/);
		expect(passesOnGlass(ceiling, grade, "lit")).toBe(true);
		expect(passesOnGlass(grey(level(ceiling) + 1), grade, "lit")).toBe(false);
	});

	it.each(GRADES)("%s: el techo pasa con la holgura puesta (el fondo 2 niveles más claro) y un nivel más ya no", (grade) => {
		const ceiling = level(GLASS.lit[grade].ceiling);
		expect(glassContrast(grey(ceiling + GLASS.margin), grade, "lit")).toBeGreaterThanOrEqual(GLASS.threshold[grade]);
		expect(glassContrast(grey(ceiling + GLASS.margin + 1), grade, "lit")).toBeLessThan(GLASS.threshold[grade]);
	});

	it.each(GRADES)("%s: cuanto más oscuro el fondo, mejor se lee", (grade) => {
		const ceiling = GLASS.lit[grade].ceiling;
		const mid = grey(Math.round(level(ceiling) / 2));
		expect(glassContrast("#000000", grade, "lit")).toBeGreaterThan(glassContrast(mid, grade, "lit"));
		expect(glassContrast(mid, grade, "lit")).toBeGreaterThan(glassContrast(ceiling, grade, "lit"));
	});

	it("sobre blanco puro el luminoso no llega: por eso sobre el contenido de la persona va el ahumado", () => {
		for (const grade of GRADES) expect(passesOnGlass("#ffffff", grade, "lit"), grade).toBe(false);
	});

	it("más grueso atenúa más: su techo es más claro que el del fino", () => {
		expect(GLASS.lit.thick.dim).toBeLessThan(GLASS.lit.thin.dim);
		expect(GLASS.lit.thin.dim).toBeLessThan(GLASS.lit.clear.dim);
		expect(level(GLASS.lit.thick.ceiling)).toBeGreaterThan(level(GLASS.lit.thin.ceiling));
	});

	/*
	 * Qué es un fondo «que controlamos», con la marca de demostración (Café Norte),
	 * sobre vidrio fino luminoso. La cuenta, a mano; cada capa redondea hacia arriba:
	 *
	 * Naranja #c2410c = (194, 65, 12).
	 *   saturate(140 %): R = 1.3148·194 − 0.286·65 − 0.0288·12 = 236.13
	 *                    G = −0.0852·194 + 1.114·65 − 0.0288·12 = 55.53
	 *                    B = −0.0852·194 − 0.286·65 + 1.3712·12 = −18.67
	 *   brightness(0.7): (165.29, 38.87, −13.07); fin del filtro, recorte a 0..255 → (166, 39, 0)
	 *   escarcha, 6 % de blanco encima: 15.3 + 0.94·canal = (171.34, 51.96, 15.3) → (172, 52, 16)
	 *   brillo, 10 % de blanco encima: 25.5 + 0.9·canal = (180.3, 72.3, 39.9) → (181, 73, 40) = #b54928
	 *   luminancia 0.147; tinta #f5f5f7 0.914: (0.914 + 0.05) / (0.147 + 0.05) = 4.9:1.
	 *   Con la holgura (el fondo en (196, 67, 14)) queda (182, 75, 40): 4.8:1. Pasa.
	 *
	 * Crema #f5ead8 = (245, 234, 216).
	 *   saturate(140 %): (248.98, 233.58, 208.38); brightness(0.7): (174.29, 163.51, 145.87) → (175, 164, 146)
	 *   escarcha: (180, 170, 153); brillo: (188, 179, 164) = #bcb3a4
	 *   luminancia 0.456: 0.964 / 0.506 = 1.9:1. No pasa.
	 */
	it("el naranja de la marca de demostración pasa en fino, también con la holgura", () => {
		expect(underGlass("#c2410c", "thin", "lit")).toBe("#b54928");
		expect(glassContrast("#c2410c", "thin", "lit")).toBeCloseTo(4.9, 1);
		expect(underGlass("#c4430e", "thin", "lit")).toBe("#b64b28");
		expect(glassContrast("#c4430e", "thin", "lit")).toBeGreaterThanOrEqual(4.5);
		expect(passesOnGlass("#c2410c", "thin", "lit")).toBe(true);
	});

	it("su crema no pasa: un fondo con esa crema bajo el vidrio pide ahumado", () => {
		expect(underGlass("#f5ead8", "thin", "lit")).toBe("#bcb3a4");
		expect(glassContrast("#f5ead8", "thin", "lit")).toBeCloseTo(1.9, 1);
		expect(passesOnGlass("#f5ead8", "thin", "lit")).toBe(false);
		expect(passesOnGlass("#f5ead8", "thin", "smoked")).toBe(true);
	});

	it("la saturación del filtro cuenta: un color vivo queda más claro de lo que diría sólo la atenuación", () => {
		// Sin saturar, el naranja atenuado sería (136, 46, 8): la cuenta daría 5.5:1 y prometería de más
		const naive = 5.5;
		expect(glassContrast("#c2410c", "thin", "lit")).toBeLessThan(naive - 0.3);
		// El ahumado satura más (180 %) que el luminoso (140 %): sin humo encima, tanta saturación volvería rojo un naranja
		expect(GLASS.saturate.lit).toBeLessThan(GLASS.saturate.smoked);
		// Un gris no tiene color que saturar: sólo se atenúa. 128 × 0.7 = 89.6 → 90; con la escarcha, 99.9 → 100; con el brillo, 115.5 → 116
		expect(underGlass("#808080", "thin", "lit")).toBe("#747474");
	});

	it("sobre negro puro la lámina no desaparece: la escarcha la levanta, entera, y el brillo más arriba", () => {
		// Sin escarcha un vidrio que sólo atenúa sería negro sobre negro, con el canto de luz y nada más
		expect(GLASS.frost).toBeGreaterThan(0);
		for (const grade of GRADES) {
			// 255 × 0.06 = 15.3 → 16 en toda la lámina; con el brillo arriba, 39.9 → 40
			expect(underGlass("#000000", grade, "lit")).toBe("#282828");
		}
	});
});

describe("la cuenta es una cota, no una simulación", () => {
	/*
	 * Entre `saturate()` y `brightness()` un motor puede recortar a 0..255 (Chrome lo
	 * hace) o no (si funde las dos matrices o trabaja en rango extendido). Si recorta,
	 * un canal que la saturación saca de rango vuelve a 255 antes de atenuarse y el
	 * resultado es MÁS OSCURO. La cuenta no recorta hasta el final del filtro: nunca
	 * queda por debajo de ninguno de los dos.
	 *
	 * Rojo #ff0000 en fino luminoso:
	 *   saturate(140 %): R = 1.3148·255 = 335.27 (fuera de rango), G = B = −0.0852·255 = −21.73
	 *   brightness(0.7) sin recortar antes: (234.69, −15.21, −15.21); fin del filtro → (235, 0, 0)
	 *   escarcha: (236.2, 15.3, 15.3) → (237, 16, 16); brillo: (238.8, 39.9, 39.9) → (239, 40, 40) = #ef2828
	 *   3.9:1: no pasa. Recortando antes de atenuar (255 × 0.7 = 179) la cuenta daba 5.5:1 y «pasaba».
	 *
	 * Magenta #ff00ff: R = B = 1.3148·255 − 0.0288·255 = 327.93 → × 0.7 = 229.55 → 230; G fuera por abajo → 0
	 *   escarcha: (232, 16, 232); brillo: (235, 40, 235) = #eb28eb; 3.2:1: no pasa. Recortando antes daba 4.5:1.
	 */
	it("un canal que la saturación saca de rango no se recorta antes de atenuar: el rojo puro no pasa en fino", () => {
		expect(underGlass("#ff0000", "thin", "lit")).toBe("#ef2828");
		expect(glassContrast("#ff0000", "thin", "lit")).toBeCloseTo(3.9, 1);
		// La cifra de la cuenta que recortaba entre los dos pasos
		expect(glassContrast("#ff0000", "thin", "lit")).toBeLessThan(5.46);
		expect(passesOnGlass("#ff0000", "thin", "lit")).toBe(false);
	});

	it("ni el magenta puro", () => {
		expect(underGlass("#ff00ff", "thin", "lit")).toBe("#eb28eb");
		expect(glassContrast("#ff00ff", "thin", "lit")).toBeCloseTo(3.2, 1);
		expect(glassContrast("#ff00ff", "thin", "lit")).toBeLessThan(4.53);
		expect(passesOnGlass("#ff00ff", "thin", "lit")).toBe(false);
	});

	it("cada capa redondea hacia arriba: un resto de décimas sube el nivel entero", () => {
		// Gris 123 en fino: 86.1 → 87 (al más cercano sería 86); escarcha 97.08 → 98; brillo 113.7 → 114
		expect(underGlass(grey(123), "thin", "lit")).toBe(grey(114));
		// Un valor exacto no sube: 130 × 0.7 = 91
		expect(underGlass(grey(130), "thin", "lit")).toBe(grey(Math.ceil(25.5 + 0.9 * Math.ceil(15.3 + 0.94 * 91))));
	});

	it("`passesOnGlass` lleva la holgura y `glassContrast` no: para decidir se usa la primera", () => {
		for (const grade of GRADES) {
			const ceiling = level(GLASS.lit[grade].ceiling);
			// Justo por encima del techo la cuenta sin holgura aún llega al umbral, y aun así no pasa
			expect(glassContrast(grey(ceiling + 1), grade, "lit")).toBeGreaterThanOrEqual(GLASS.threshold[grade]);
			expect(passesOnGlass(grey(ceiling + 1), grade, "lit")).toBe(false);
		}
		// La holgura no se sale de rango
		expect(passesOnGlass("#ffffff", "thin", "smoked")).toBe(true);
	});
});

describe("la tinta y las entradas", () => {
	it("por defecto mide la tinta del sistema, y acepta otra", () => {
		expect(glassContrast("#000000", "thick", "smoked")).toBe(glassContrast("#000000", "thick", "smoked", GLASS.ink));
		expect(glassContrast("#000000", "thick", "smoked", "#c7c7cc")).toBeLessThan(glassContrast("#000000", "thick", "smoked"));
	});

	it("acepta mayúsculas y rechaza lo que no es #rrggbb", () => {
		expect(underGlass("#C2410C", "thin", "lit")).toBe(underGlass("#c2410c", "thin", "lit"));
		for (const bad of ["c2410c", "#fff", "rgb(0,0,0)", "#gggggg", ""]) expect(() => underGlass(bad, "thin", "lit"), bad).toThrow(RangeError);
	});
});

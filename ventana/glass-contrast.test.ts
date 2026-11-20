/**
 * La cuenta del contraste sobre vidrio (`glass-contrast.ts`): la garantía del
 * ahumado dicha con la función, los techos del luminoso como frontera exacta, y
 * dos colores de una marca que enseñan qué es un fondo «que controlamos».
 * Que los números de `GLASS` sean los de los tokens lo comprueba
 * `tests/ventana-tokens.test.ts` (aquí no se lee CSS).
 */
import { describe, expect, it } from "vitest";
import type { GlassGrade as PieceGrade } from "./glass";
import { GLASS, glassContrast, passesOnGlass, underGlass, type GlassDensity, type GlassGrade } from "./glass-contrast";

const GRADES: GlassGrade[] = ["clear", "thin", "thick"];

/** El gris neutro un paso más claro (cada canal +1). */
const lighter = (hex: string) => "#" + (parseInt(hex.slice(1, 3), 16) + 1).toString(16).padStart(2, "0").repeat(3);

describe("los tipos", () => {
	it("el grado de la cuenta es el de la pieza", () => {
		// Si los dos tipos se separan, estas dos asignaciones dejan de compilar (`npm run typecheck`)
		const fromPiece: GlassGrade[] = ["clear", "thin", "thick"] satisfies PieceGrade[];
		const toPiece: PieceGrade[] = GRADES;
		expect(fromPiece).toEqual(toPiece);
		const densities: GlassDensity[] = ["smoked", "lit"];
		expect(densities).toHaveLength(2);
	});
});

describe("vidrio ahumado: la garantía es sobre blanco puro", () => {
	it("bajo el fino, con blanco puro detrás, queda el mismo color que calcula la prueba de tokens", () => {
		// humo rgba(44,44,50,0.74) sobre #ffffff = (99,99,103); brillo 6 % encima = (108,108,112)
		expect(underGlass("#ffffff", "thin", "smoked")).toBe("#6c6c70");
		expect(underGlass("#ffffff", "clear", "smoked")).toBe("#89898c");
		expect(underGlass("#ffffff", "thick", "smoked")).toBe("#4f4f53");
	});

	it.each(GRADES)("%s deja leer la tinta sobre blanco puro", (grade) => {
		expect(glassContrast("#ffffff", grade, "smoked")).toBeGreaterThanOrEqual(GLASS.threshold[grade]);
		expect(passesOnGlass("#ffffff", grade, "smoked")).toBe(true);
	});

	it("y por tanto sobre cualquier color: ninguno queda más claro que el blanco bajo el humo", () => {
		for (const backdrop of ["#000000", "#808080", "#c2410c", "#f5ead8", "#ffff00", "#00ffff"]) {
			for (const grade of GRADES) expect(passesOnGlass(backdrop, grade, "smoked"), `${backdrop} ${grade}`).toBe(true);
		}
	});
});

describe("vidrio luminoso: la garantía es sobre un techo declarado", () => {
	it.each(GRADES)("%s: el techo pasa y el gris siguiente ya no", (grade) => {
		const ceiling = GLASS.lit[grade].ceiling;
		expect(ceiling).toMatch(/^#([0-9a-f]{2})\1\1$/);
		expect(passesOnGlass(ceiling, grade, "lit")).toBe(true);
		expect(passesOnGlass(lighter(ceiling), grade, "lit")).toBe(false);
	});

	it.each(GRADES)("%s: cuanto más oscuro el fondo, mejor se lee", (grade) => {
		const ceiling = GLASS.lit[grade].ceiling;
		const mid = "#" + Math.round(parseInt(ceiling.slice(1, 3), 16) / 2).toString(16).padStart(2, "0").repeat(3);
		expect(glassContrast("#000000", grade, "lit")).toBeGreaterThan(glassContrast(mid, grade, "lit"));
		expect(glassContrast(mid, grade, "lit")).toBeGreaterThan(glassContrast(ceiling, grade, "lit"));
	});

	it("sobre blanco puro el luminoso no llega: por eso sobre el contenido de la persona va el ahumado", () => {
		for (const grade of GRADES) expect(passesOnGlass("#ffffff", grade, "lit"), grade).toBe(false);
	});

	it("más grueso atenúa más: su techo es más claro que el del fino", () => {
		expect(GLASS.lit.thick.dim).toBeLessThan(GLASS.lit.thin.dim);
		expect(GLASS.lit.thin.dim).toBeLessThan(GLASS.lit.clear.dim);
		expect(parseInt(GLASS.lit.thick.ceiling.slice(1, 3), 16)).toBeGreaterThan(parseInt(GLASS.lit.thin.ceiling.slice(1, 3), 16));
	});

	/*
	 * Qué es un fondo «que controlamos», con la marca de demostración (Café Norte),
	 * sobre vidrio fino luminoso. La cuenta, a mano:
	 *
	 * Naranja #c2410c = (194, 65, 12).
	 *   saturate(180 %): R = 1.6296·194 − 0.572·65 − 0.0576·12 = 278.3 → 255
	 *                    G = −0.1704·194 + 1.228·65 − 0.0576·12 = 46.1 → 46
	 *                    B = −0.1704·194 − 0.572·65 + 1.7424·12 = −49.3 → 0
	 *   brightness(0.72): (183.6, 33.1, 0) → (184, 33, 0)
	 *   brillo 10 % de blanco encima: 25.5 + 0.9·canal → (191, 55, 26) = #bf371a
	 *   luminancia 0.139; tinta #f5f5f7 0.913: (0.913 + 0.05) / (0.139 + 0.05) = 5.1:1. Pasa.
	 *
	 * Crema #f5ead8 = (245, 234, 216).
	 *   saturate(180 %): (253, 233, 201); brightness(0.72): (182, 168, 145)
	 *   brillo: (189, 177, 156) = #bdb19c; luminancia 0.445: 0.963 / 0.495 = 1.9:1. No pasa.
	 */
	it("el naranja de la marca de demostración pasa en fino", () => {
		expect(underGlass("#c2410c", "thin", "lit")).toBe("#bf371a");
		expect(glassContrast("#c2410c", "thin", "lit")).toBeCloseTo(5.1, 1);
		expect(passesOnGlass("#c2410c", "thin", "lit")).toBe(true);
	});

	it("su crema no pasa: un fondo con esa crema bajo el vidrio pide ahumado", () => {
		expect(underGlass("#f5ead8", "thin", "lit")).toBe("#bdb19c");
		expect(glassContrast("#f5ead8", "thin", "lit")).toBeCloseTo(1.9, 1);
		expect(passesOnGlass("#f5ead8", "thin", "lit")).toBe(false);
		expect(passesOnGlass("#f5ead8", "thin", "smoked")).toBe(true);
	});

	it("la saturación del filtro cuenta: un color vivo queda más claro de lo que diría sólo la atenuación", () => {
		// Sin saturar, el naranja atenuado sería (140, 47, 9): la cuenta daría 6.1:1 y prometería de más
		const naive = 6.1;
		expect(glassContrast("#c2410c", "thin", "lit")).toBeLessThan(naive - 0.5);
		// Un gris no tiene color que saturar: sólo se atenúa
		expect(underGlass("#808080", "thin", "lit")).toBe("#6c6c6c");
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

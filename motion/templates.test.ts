import { describe, expect, it } from "vitest";
import { TEMPLATES, getTemplate } from "./templates";

describe("templates", () => {
	it("software-launch is the only template and has no voice", () => {
		expect(Object.keys(TEMPLATES)).toEqual(["software-launch"]);
		const t = getTemplate("software-launch")!;
		expect(t.voice).toBe(false);
		expect(t.kinds).toEqual(["platform"]);
		expect(t.defaultBpm).toBe(116);
		expect(t.moments.map((m) => [m.key, m.block, m.beats, m.transition, m.optional])).toEqual([
			["hook", "text", 4, "blur", false],
			["products", "icons", 8, "push", false],
			["list", "icons", 12, "blur", true],
			["demo", "ui", 8, "blur", true],
			["benefit", "text", 4, "blur", false],
			["close", "logo", 4, "cut", false],
		]);
	});

	it("every moment has sample lines in en, es and pt where it takes lines", () => {
		const t = getTemplate("software-launch")!;
		for (const m of t.moments.filter((m) => m.block === "text")) {
			for (const lang of ["en", "es", "pt"] as const) expect((m.sample[lang] as { lines?: string[] }).lines?.length).toBeGreaterThan(0);
		}
		// Guías genéricas, nunca el texto de una marca (el de OnDesk salía a todo el mundo).
		const all = JSON.stringify(t.moments.map((m) => m.sample));
		expect(all).not.toMatch(/apps|OnDesk|Seis|Six|Seis apps/i);
	});

	it("every moment tells Lumen what to write", () => {
		for (const m of getTemplate("software-launch")!.moments) expect(m.write.length).toBeGreaterThan(20);
	});

	it("an unknown id gives null", () => {
		expect(getTemplate("nope")).toBeNull();
	});
});

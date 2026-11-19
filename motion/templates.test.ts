import { describe, expect, it } from "vitest";
import { adaptTemplate, plannedSeconds } from "./adapt";
import { TEMPLATES, TEMPLATE_IDS, getTemplate } from "./templates";
import type { MaterialItem, Template } from "./types";

const LANGS = ["en", "es", "pt"] as const;

/** El material justo para que cada momento que consume tenga lo mínimo. */
function minimum(t: Template): MaterialItem[] {
	const out: MaterialItem[] = [];
	for (const m of t.moments) {
		if (!m.consumes || m.consumes.shared) continue;
		const n = (m.repeat?.min ?? 1) * m.consumes.min;
		for (let i = 0; i < n; i++) out.push({ id: `${m.key}-${i}`, kind: m.consumes.kind });
	}
	return out;
}

const needsImages = (block: string) => block === "ui" || block === "product" || block === "icons";

describe("the template library (entrega 1)", () => {
	it("has the eight templates in the gallery's order", () => {
		expect(TEMPLATE_IDS).toEqual(["software-launch", "news", "integrations", "product", "catalog", "how-to", "offer", "brand-story"]);
		expect(Object.keys(TEMPLATES).sort()).toEqual([...TEMPLATE_IDS].sort());
	});

	it("every template has a name and description in en, es and pt, says when to choose it and ends on a logo", () => {
		for (const t of Object.values(TEMPLATES)) {
			for (const lang of LANGS) {
				expect([t.id, lang, t.name[lang].length > 0, t.description[lang].length > 0]).toEqual([t.id, lang, true, true]);
			}
			expect(t.when.length).toBeGreaterThan(20);
			expect(t.moments.at(-1)!.block).toBe("logo");
			expect("voice" in t).toBe(false);
		}
	});

	it("every moment that takes words tells Lumen what to write and has a sample in en, es and pt", () => {
		for (const t of Object.values(TEMPLATES)) {
			for (const m of t.moments) {
				expect([t.id, m.key, m.write.length > 20]).toEqual([t.id, m.key, true]);
				if (!m.slots.lines) continue;
				for (const lang of LANGS) {
					const lines = (m.sample[lang] as { lines?: string[] } | undefined)?.lines ?? [];
					expect([t.id, m.key, lang, lines.length > 0]).toEqual([t.id, m.key, lang, true]);
				}
			}
		}
	});

	it("samples are generic guides, never a brand's text", () => {
		const all = JSON.stringify(Object.values(TEMPLATES).map((t) => t.moments.map((m) => m.sample)));
		// Con mayúscula y palabra entera: «a nova coleção» es portugués, no la marca Nova.
		expect(all).not.toMatch(/\bOnDesk\b|\bNova\b|\bPulse\b|Seis apps|Six apps|\bArcade\b/);
	});

	it("with the minimum material, every template fits Free's 15 s and leaves no image moment without its images", () => {
		for (const t of Object.values(TEMPLATES)) {
			const ms = adaptTemplate(t, minimum(t), { bpm: 116, targetSeconds: 15, maxSeconds: 15 });
			expect([t.id, plannedSeconds(ms, 116) <= 15]).toEqual([t.id, true]);
			for (const m of ms) {
				const min = t.moments.find((x) => x.key === m.templateKey)?.consumes?.min ?? 0;
				if (needsImages(m.block)) expect([t.id, m.key, m.imageIds.length >= Math.max(1, min)]).toEqual([t.id, m.key, true]);
			}
		}
	});

	it("with no material at all, no template leaves an image moment empty", () => {
		for (const t of Object.values(TEMPLATES)) {
			const ms = adaptTemplate(t, [], { bpm: 116, targetSeconds: 30, maxSeconds: 60 });
			for (const m of ms) if (needsImages(m.block)) expect([t.id, m.key, m.imageIds.length > 0]).toEqual([t.id, m.key, true]);
			expect(ms.at(-1)!.block).toBe("logo");
		}
	});

	it("brand-story with no material grows to 60 s with extra phrases", () => {
		const ms = adaptTemplate(getTemplate("brand-story")!, [], { bpm: 116, targetSeconds: 60, maxSeconds: 60 });
		expect(ms.some((m) => m.expanded)).toBe(true);
	});

	it("software-launch shows the kit's brands both as a burst and as a list", () => {
		const logos: MaterialItem[] = [0, 1, 2].map((i) => ({ id: `l${i}`, kind: "logo" }));
		const ms = adaptTemplate(getTemplate("software-launch")!, logos, { bpm: 116, targetSeconds: 30, maxSeconds: 60 });
		expect(ms.filter((m) => m.block === "icons").map((m) => [m.templateKey, m.imageIds])).toEqual([
			["products", ["l0", "l1", "l2"]],
			["list", ["l0", "l1", "l2"]],
		]);
	});

	it("an unknown id gives null", () => {
		expect(getTemplate("nope")).toBeNull();
	});
});

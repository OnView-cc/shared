import { describe, expect, it } from "vitest";
import { adaptTemplate, plannedSeconds, type PlannedMoment } from "./adapt";
import { parseMaterialKind, type MaterialItem, type Template } from "./types";

/** Un template de prueba: una frase ampliable, una demo por captura (1 a 3), unos iconos opcionales y el cierre. */
const T: Template = {
	id: "test",
	name: { en: "Test", es: "Prueba", pt: "Teste" },
	description: { en: "", es: "", pt: "" },
	when: "Never: only for tests.",
	materials: [{ kind: "screenshot", required: false }],
	kinds: ["platform"],
	style: "arcade",
	moments: [
		{ key: "hook", block: "text", beats: 4, transition: "blur", optional: false, slots: { lines: { max: 3, wordsPerLine: 3 } }, write: "The hook.", sample: {}, expandable: true },
		{ key: "demo", block: "ui", beats: 8, transition: "blur", optional: false, expandable: true, slots: { images: { min: 1, max: 1 } }, write: "A screenshot.", sample: {}, consumes: { kind: "screenshot", min: 1, max: 1 }, repeat: { min: 1, max: 3 }, onMissing: "text" },
		{ key: "marks", block: "icons", beats: 8, transition: "push", optional: true, slots: { images: { min: 2, max: 6 } }, write: "The brands.", sample: {}, consumes: { kind: "logo", min: 2, max: 6 } },
		{ key: "close", block: "logo", beats: 4, transition: "cut", optional: false, slots: {}, write: "The closing.", sample: {} },
	],
};

const shots = (n: number): MaterialItem[] => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, kind: "screenshot" }));
const logos = (n: number): MaterialItem[] => Array.from({ length: n }, (_, i) => ({ id: `l${i}`, kind: "logo" }));
const keys = (ms: PlannedMoment[]) => ms.map((m) => m.key);

describe("adaptTemplate", () => {
	it("sin material, 15 s: the demo becomes a phrase and the optional icons go", () => {
		const ms = adaptTemplate(T, [], { bpm: 120, targetSeconds: 15, maxSeconds: 15 });
		const demo = ms.find((m) => m.templateKey === "demo")!;
		expect(demo).toMatchObject({ block: "text", fallback: true, imageIds: [] });
		expect(ms.some((m) => m.templateKey === "marks")).toBe(false);
		expect(plannedSeconds(ms, 120)).toBeLessThanOrEqual(15);
		expect(ms.at(-1)!.block).toBe("logo");
	});

	it("tres capturas, 60 s: one demo per screenshot, each with its image", () => {
		const ms = adaptTemplate(T, shots(3), { bpm: 120, targetSeconds: 60, maxSeconds: 60 });
		const demos = ms.filter((m) => m.templateKey === "demo" && m.block === "ui" && !m.expanded);
		expect(demos.slice(0, 3).map((m) => [m.key, m.imageIds])).toEqual([
			["demo", ["s0"]],
			["demo#2", ["s1"]],
			["demo#3", ["s2"]],
		]);
	});

	it("cinco capturas: at most three demos from the material", () => {
		const ms = adaptTemplate(T, shots(5), { bpm: 120, targetSeconds: 15, maxSeconds: 60 });
		const used = new Set(ms.flatMap((m) => m.imageIds));
		expect(used.size).toBeLessThanOrEqual(3);
	});

	it("plan Free 15 s con 3 capturas: the repeats go before the optional icons", () => {
		const ms = adaptTemplate(T, [...shots(3), ...logos(2)], { bpm: 120, targetSeconds: 15, maxSeconds: 15 });
		expect(keys(ms).filter((k) => k.startsWith("demo"))).toEqual(["demo"]);
		expect(ms.some((m) => m.templateKey === "marks")).toBe(true);
		expect(plannedSeconds(ms, 120 * 0.85)).toBeLessThanOrEqual(15);
	});

	it("objetivo 60 s con poco material: grows by stretching phrases, then extra phrases, then reusing a screenshot, never past the plan", () => {
		const ms = adaptTemplate(T, shots(1), { bpm: 120, targetSeconds: 60, maxSeconds: 60 });
		expect(ms.find((m) => m.key === "hook")!.beats).toBe(8);
		expect(ms.filter((m) => m.expanded).length).toBeGreaterThan(0);
		expect(ms.filter((m) => m.expanded && m.block === "text").length).toBeLessThanOrEqual(3);
		const reused = ms.filter((m) => m.block === "ui" && m.expanded);
		expect(reused.length).toBeLessThanOrEqual(2);
		for (const r of reused) expect(r.imageIds).toEqual(["s0"]);
		expect(plannedSeconds(ms, 120 * 0.85)).toBeLessThanOrEqual(60);
		expect(new Set(keys(ms)).size).toBe(ms.length);
	});

	it("an expandable image moment is reused as an image, never turned into an extra phrase", () => {
		const ms = adaptTemplate(T, shots(1), { bpm: 120, targetSeconds: 60, maxSeconds: 60 });
		expect(ms.filter((m) => m.templateKey === "demo" && m.block === "text")).toEqual([]);
	});

	it("an image moment that is not expandable is never reused to grow", () => {
		const fixed: Template = { ...T, moments: T.moments.map((m) => (m.key === "demo" ? { ...m, expandable: false } : m)) };
		const ms = adaptTemplate(fixed, shots(1), { bpm: 120, targetSeconds: 60, maxSeconds: 60 });
		expect(ms.filter((m) => m.block === "ui").map((m) => m.key)).toEqual(["demo"]);
	});

	it("an image of unknown kind counts as other and never fills a demo", () => {
		const ms = adaptTemplate(T, [{ id: "x", kind: parseMaterialKind("banana") }], { bpm: 120, targetSeconds: 15, maxSeconds: 15 });
		expect(ms.flatMap((m) => m.imageIds)).toEqual([]);
	});

	it("is deterministic", () => {
		const a = adaptTemplate(T, [...shots(2), ...logos(3)], { bpm: 116, targetSeconds: 30, maxSeconds: 60 });
		const b = adaptTemplate(T, [...shots(2), ...logos(3)], { bpm: 116, targetSeconds: 30, maxSeconds: 60 });
		expect(a).toEqual(b);
	});

	it("a shared moment shows the same pieces as an earlier one without using them up", () => {
		const both: Template = {
			...T,
			moments: [
				{ key: "burst", block: "icons", beats: 8, transition: "push", optional: false, slots: {}, write: "Icons.", sample: {}, consumes: { kind: "logo", min: 2, max: 6 } },
				{ key: "list", block: "icons", beats: 8, transition: "blur", optional: true, slots: {}, write: "The same icons as a list.", sample: {}, consumes: { kind: "logo", min: 2, max: 6, shared: true } },
				{ key: "close", block: "logo", beats: 4, transition: "cut", optional: false, slots: {}, write: "The closing.", sample: {} },
			],
		};
		const ms = adaptTemplate(both, logos(3), { bpm: 120, targetSeconds: 15, maxSeconds: 60 });
		expect(ms.filter((m) => m.block === "icons").map((m) => m.imageIds)).toEqual([
			["l0", "l1", "l2"],
			["l0", "l1", "l2"],
		]);
	});

	it("a group repeats together, and a missing piece drops only its own moment", () => {
		const news: Template = {
			...T,
			id: "news",
			moments: [
				{ key: "title", block: "text", beats: 4, transition: "blur", optional: false, slots: { lines: { max: 2, wordsPerLine: 4 } }, write: "A change.", sample: {}, repeat: { min: 2, max: 4, group: "change" } },
				{ key: "shot", block: "ui", beats: 8, transition: "blur", optional: false, slots: { images: { min: 1, max: 1 } }, write: "Its screenshot.", sample: {}, consumes: { kind: "screenshot", min: 1, max: 1 }, repeat: { min: 2, max: 4, group: "change" }, onMissing: "drop" },
				{ key: "close", block: "logo", beats: 4, transition: "cut", optional: false, slots: {}, write: "The closing.", sample: {} },
			],
		};
		// 15 s: sin sitio para reutilizar la captura (eso sería crecer, paso 5c, y también usaría «shot#2»).
		const ms = adaptTemplate(news, shots(1), { bpm: 120, targetSeconds: 15, maxSeconds: 60 });
		expect(keys(ms)).toEqual(["title", "shot", "title#2", "close"]);
		expect(ms.find((m) => m.key === "shot")!.imageIds).toEqual(["s0"]);
	});
});

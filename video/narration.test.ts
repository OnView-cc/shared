import { describe, expect, it } from "vitest";
import { alignNarration, LEAD, momentWords, normalizeWord, type TimedWord } from "./narration";

const lines = [
	{ shotId: "a", text: "What if intelligence was part of everything?" },
	{ shotId: "b", text: "Pulse, Orbit and Halo work together." },
	{ shotId: "c", text: "Meet Nova." },
];

// La toma: «What if intelligence was part of everything? Pulse, Orbit and Halo work together. Meet Nova.»
const heard: TimedWord[] = [
	["What", 0.2, 0.4],
	["if", 0.4, 0.5],
	["intelligence", 0.5, 1.1],
	["was", 1.1, 1.3],
	["part", 1.3, 1.6],
	["of", 1.6, 1.7],
	["everything?", 1.7, 2.4],
	["Pulse,", 3.0, 3.4],
	["Orbit", 3.6, 4.0],
	["and", 4.0, 4.1],
	["Halo", 4.2, 4.6],
	["work", 4.6, 4.9],
	["together.", 4.9, 5.5],
	["Meet", 6.1, 6.3],
	["Nova.", 6.3, 6.8],
].map(([word, start, end]) => ({ word: word as string, start: start as number, end: end as number }));

describe("normalizeWord", () => {
	it("drops case, accents and signs", () => {
		expect(normalizeWord("OnDesk.cc")).toBe("ondeskcc");
		expect(normalizeWord("Créditos,")).toBe("creditos");
		expect(normalizeWord("¿Qué?")).toBe("que");
	});
});

describe("alignNarration (2026-11-20)", () => {
	it("cuts each line a little before its first word, and the slices cover the whole take with no gaps", () => {
		const { slices, aligned } = alignNarration(lines, heard, 7);
		expect(aligned).toBe(true);
		expect(slices.map((s) => s.shotId)).toEqual(["a", "b", "c"]);
		expect(slices.map((s) => [s.from, s.to])).toEqual([
			[0, 2.88],
			[2.88, 5.98],
			[5.98, 7],
		]);
		expect(slices[1]).toMatchObject({ spokenFrom: 3.0, spokenTo: 5.5 });
		expect(slices[1]!.words.map((w) => w.word)).toEqual(["Pulse,", "Orbit", "and", "Halo", "work", "together."]);
	});

	it("survives a misheard word: the rest still lines up", () => {
		const off = heard.map((w) => (w.word === "Orbit" ? { ...w, word: "Orbital" } : w));
		const { slices } = alignNarration(lines, off, 7);
		expect(slices[1]).toMatchObject({ spokenFrom: 3.0, spokenTo: 5.5 });
	});

	it("a line it cannot find is spread by characters between its neighbours", () => {
		const missing = heard.filter((w) => !["Pulse,", "Orbit", "and", "Halo", "work", "together."].includes(w.word));
		const { slices } = alignNarration(lines, missing, 7);
		expect(slices[1]!.spokenFrom).toBeCloseTo(2.4);
		expect(slices[1]!.spokenTo).toBeCloseTo(6.1 - LEAD);
		expect(slices[1]!.words).toEqual([]);
		expect(slices[2]!.from).toBeCloseTo(6.1 - LEAD);
	});

	it("with no words at all, everything is spread by characters over the take", () => {
		const { slices, aligned } = alignNarration(lines, [], 9);
		expect(aligned).toBe(false);
		expect(slices[0]!.from).toBe(0);
		expect(slices.at(-1)!.to).toBe(9);
		for (let i = 1; i < slices.length; i++) expect(slices[i]!.from).toBeCloseTo(slices[i - 1]!.to);
	});

	it("momentWords are relative to the start of their slice", () => {
		const { slices } = alignNarration(lines, heard, 7);
		const b = momentWords(slices[1]!);
		expect(b.spoken.from).toBeCloseTo(LEAD);
		expect(b.words[1]).toEqual({ w: "Orbit", at: expect.closeTo(3.6 - (3.0 - LEAD), 3), end: expect.closeTo(4.0 - (3.0 - LEAD), 3) });
	});
});

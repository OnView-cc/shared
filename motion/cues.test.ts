import { describe, expect, it } from "vitest";
import { cueTimes } from "./cues";

const said = (...pairs: [string, number][]) => pairs.map(([w, at]) => ({ w, at, end: at + 0.3 }));
const spoken = { from: 0.1, to: 5 };

describe("cueTimes (2026-11-20)", () => {
	it("each item comes in when the voice names it, in order", () => {
		const words = said(["Pulse", 0.2], ["for", 0.6], ["support,", 0.7], ["Orbit", 1.4], ["for", 1.8], ["projects,", 1.9], ["Halo", 2.6], ["for", 3], ["meetings.", 3.1]);
		expect(cueTimes(["Pulse", "Orbit", "Halo"], words, spoken)).toEqual([0.2, 1.4, 2.6]);
	});

	it("a text line is found by one of its content words, not by 'the' or 'your'; one said too early is spread over what is left", () => {
		const words = said(["What", 0.1], ["if", 0.3], ["your", 0.4], ["work", 0.6], ["had", 0.9], ["intelligence", 1.1], ["built", 1.8], ["in?", 2.0]);
		expect(cueTimes(["Intelligence,", "built into", "your work."], words, spoken)).toEqual([1.1, 1.8, expect.closeTo(3.4, 5)]);
	});

	it("what the voice does not say is spread between what it does, over what is spoken", () => {
		const words = said(["Pulse", 1], ["Halo", 3]);
		expect(cueTimes(["OnDesk.cc", "Pulse", "Orbit", "Halo", "Atlas"], words, spoken)).toEqual([0.1, 1, 2, 3, 4]);
	});

	it("never goes back in time, and without words it is null (the block keeps its beats)", () => {
		expect(cueTimes(["Halo", "Pulse"], said(["Pulse", 0.5], ["Halo", 2]), spoken)).toEqual([2, 3.5]);
		expect(cueTimes(["Pulse"], undefined, spoken)).toBeNull();
		expect(cueTimes(["Pulse"], [], spoken)).toBeNull();
	});
});

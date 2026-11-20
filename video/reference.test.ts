import { describe, expect, it } from "vitest";
import { MAX_REFERENCE_BYTES, MAX_REFERENCE_SECONDS, referenceLine, REFERENCE_TTL_SECONDS } from "./reference";

describe("the reference video", () => {
	it("has the spec's limits: 90 s, 100 MB, kept 30 days", () => {
		expect(MAX_REFERENCE_SECONDS).toBe(90);
		expect(MAX_REFERENCE_BYTES).toBe(104857600);
		expect(REFERENCE_TTL_SECONDS).toBe(2592000);
	});

	it("tells Lumen its measures in one line", () => {
		expect(referenceLine({ seconds: 24.2, width: 1080, height: 1920, cuts: [1, 2.5, 4], shotSeconds: 1.66, bpm: 121.6, brightness: "dark", colors: ["#101010", "#ff5500"] })).toBe(
			"[Reference video: 24 s, 1080x1920, 3 cuts (1.7 s each), ~122 BPM, dark, colors #101010 #ff5500]",
		);
		expect(referenceLine({ seconds: 10, width: 1920, height: 1080, cuts: [], shotSeconds: 10, bpm: null, brightness: "light", colors: [] })).toContain("no clear tempo");
	});
});

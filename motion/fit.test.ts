import { describe, expect, it } from "vitest";
import { beatSeconds, FIT_HEADROOM, fitTemplate } from "./fit";
import { getTemplate } from "./templates";
import { parseBlockParams } from "./types";

const launch = getTemplate("software-launch")!;

describe("fitTemplate", () => {
	it("fitTemplate keeps every moment when the plan allows it", () => {
		const kept = fitTemplate(launch, { bpm: 116, maxSeconds: 60 });
		expect(kept.map((m) => m.key)).toEqual(launch.moments.map((m) => m.key));
		expect(kept).toHaveLength(6);
	});

	it("fitTemplate drops optional moments from the end until it fits Free, with room for a slower measured tempo", () => {
		const kept = fitTemplate(launch, { bpm: 116, maxSeconds: 15 });
		expect(kept.map((m) => m.key)).toEqual(["hook", "products", "benefit", "close"]);
		const counted = kept.slice(0, -1).reduce((n, m) => n + m.beats, 0);
		expect(counted).toBe(16);
		// La música medida puede ir más lenta que la pedida: cabe aun a un 15 % menos de tempo.
		expect(counted * beatSeconds(116 * FIT_HEADROOM)).toBeLessThanOrEqual(15);
	});

	it("fitTemplate returns what is left even if it still does not fit", () => {
		const kept = fitTemplate(launch, { bpm: 116, maxSeconds: 1 });
		expect(kept.map((m) => m.key)).toEqual(["hook", "products", "benefit", "close"]);
	});

	it("beatSeconds is 60 over bpm", () => {
		expect(beatSeconds(120)).toBe(0.5);
	});
});

describe("parseBlockParams", () => {
	it("parseBlockParams fills defaults and clamps", () => {
		expect(parseBlockParams("text", {}).lines).toEqual([]);
		expect(parseBlockParams("text", { lines: ["a", "b", "c", "d", "e"] }).lines).toEqual(["a", "b", "c"]);
		expect(parseBlockParams("text", { lines: ["x".repeat(90)] }).lines[0]).toHaveLength(60);
		expect(parseBlockParams("ui", { click: { x: 1.4, y: -2 } }).click).toEqual({ x: 1, y: 0 });
		expect(parseBlockParams("icons", {}).every).toBe(2);
		expect(parseBlockParams("icons", {}).variant).toBe("burst");
		expect(parseBlockParams("logo", { line: "y".repeat(80) }).line).toHaveLength(60);
	});

	it("parseBlockParams survives garbage", () => {
		expect(parseBlockParams("clip", "nope")).toEqual({ text: "", textPosition: "bottom", textIn: 0, textOut: null, imagesLayout: "grid", imagesEntrance: "stagger" });
		expect(parseBlockParams("icons", { labels: { a: 3, b: "z".repeat(40) } }).labels).toEqual({ b: "z".repeat(24) });
		expect(parseBlockParams("text", { color: "red" }).color).toBeNull();
		expect(parseBlockParams("text", { color: "#1c3b2f" }).color).toBe("#1c3b2f");
	});
});

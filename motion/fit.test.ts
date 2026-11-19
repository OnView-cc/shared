import { describe, expect, it } from "vitest";
import { beatSeconds } from "./fit";
import { parseBlockParams } from "./types";

describe("beatSeconds", () => {
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
		expect(parseBlockParams("text", "nope")).toEqual({ lines: [], color: null });
		expect(parseBlockParams("icons", { labels: { a: 3, b: "z".repeat(40) } }).labels).toEqual({ b: "z".repeat(24) });
		expect(parseBlockParams("text", { color: "red" }).color).toBeNull();
		expect(parseBlockParams("text", { color: "#1c3b2f" }).color).toBe("#1c3b2f");
	});
});

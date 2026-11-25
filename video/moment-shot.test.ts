import { describe, expect, it } from "vitest";
import { toComposeShot, type MomentRow } from "./moment-shot";

const row = (o: Partial<MomentRow>): MomentRow => ({
	id: "s1",
	position: 0,
	seconds: 4,
	block: "text",
	blockParams: {},
	beats: null,
	transition: "cut",
	imagesLayout: "grid",
	imagesEntrance: "stagger",
	voice: null,
	images: [],
	...o,
});

describe("toComposeShot", () => {
	it("a text moment takes its lines from its params", () => {
		const s = toComposeShot(row({ blockParams: { lines: ["Hola"] } }));
		expect(s.params).toEqual({ lines: ["Hola"], color: null });
	});

	it("icons never put an image description in the video: an image without a label has no name", () => {
		const images = [
			{ id: "a", src: "a.png", width: 1, height: 1, description: "Logo de Soporte" },
			{ id: "b", src: "b.png", width: 1, height: 1, description: "x".repeat(40) },
			{ id: "c", src: "c.png", width: 1, height: 1, description: null },
		];
		const s = toComposeShot(row({ block: "icons", blockParams: { variant: "list", labels: { a: "Soporte" } }, images }));
		expect((s.params as { labels: Record<string, string> }).labels).toEqual({ a: "Soporte" });
		expect(s.images).toEqual(images.map(({ description: _d, ...rest }) => rest));
	});

	it("a text moment with images lays them out by its own fields", () => {
		const images = [{ id: "a", src: "a.png", width: 1, height: 1 }];
		const s = toComposeShot(row({ block: "text", blockParams: { lines: ["Too many apps"] }, imagesLayout: "sequence", imagesEntrance: "fade", images }));
		expect(s.params).toEqual({ lines: ["Too many apps"], color: null, imagesLayout: "sequence", imagesEntrance: "fade" });
	});

	it("other blocks keep their params, validated", () => {
		expect(toComposeShot(row({ block: "text", blockParams: { lines: ["a", "b", "c", "d"] }, beats: 4, transition: "blur" }))).toMatchObject({ block: "text", params: { lines: ["a", "b", "c"], color: null }, beats: 4, transition: "blur" });
	});
});

describe("toComposeShot with a scene (spec 2026-11-24)", () => {
	it("passes the ready scene through, and none when there is none", () => {
		const scene = { code: "export default function scene(ctx, kit) {}", texts: { headline: "Hola" }, kitVersion: 1, events: [{ kind: "click" as const, at: 1, n: 0 }] };
		expect(toComposeShot(row({ scene })).scene).toEqual(scene);
		expect(toComposeShot(row({})).scene).toBeUndefined();
		expect(toComposeShot(row({ scene: null })).scene).toBeUndefined();
	});
});

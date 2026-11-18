import { describe, expect, it } from "vitest";
import { toComposeShot, type MomentRow } from "./moment-shot";

const row = (o: Partial<MomentRow>): MomentRow => ({
	id: "s1",
	position: 0,
	seconds: 4,
	block: "clip",
	blockParams: {},
	beats: null,
	transition: "cut",
	onScreenText: "",
	textPosition: "bottom",
	textIn: 0,
	textOut: null,
	imagesLayout: "grid",
	imagesEntrance: "stagger",
	trimIn: 0,
	trimOut: null,
	clip: null,
	still: null,
	voice: null,
	images: [],
	...o,
});

describe("toComposeShot", () => {
	it("a clip takes its text and layout from its own fields", () => {
		const s = toComposeShot(row({ onScreenText: "Hola", textPosition: "top", textIn: 0.5, textOut: 3, imagesLayout: "center", imagesEntrance: "fade", blockParams: { text: "stale" } }));
		expect(s.params).toEqual({ text: "Hola", textPosition: "top", textIn: 0.5, textOut: 3, imagesLayout: "center", imagesEntrance: "fade" });
	});

	it("icons name an image by its description when it has no label", () => {
		const images = [
			{ id: "a", src: "a.png", width: 1, height: 1, description: "Logo de Soporte" },
			{ id: "b", src: "b.png", width: 1, height: 1, description: "x".repeat(40) },
			{ id: "c", src: "c.png", width: 1, height: 1, description: null },
		];
		const s = toComposeShot(row({ block: "icons", blockParams: { variant: "list", labels: { a: "Soporte" } }, images }));
		expect(s.params).toMatchObject({ variant: "list", labels: { a: "Soporte", b: "x".repeat(24) } });
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

import { describe, expect, it } from "vitest";
import { CORNER_MARGIN, IMAGE_FADE, IMAGE_RISE, IMAGE_STAGGER, placeImages, type ImagesLayout } from "./scene-images";
import { TEXT_SIZE, type Format } from "./compose";

const FORMATS: Format[] = ["9:16", "1:1", "16:9"];
const LAYOUTS: ImagesLayout[] = ["grid", "sequence", "center", "corner"];
/** El cuadro con el lado corto = 1. */
const frame = (f: Format) => (f === "9:16" ? { W: 9 / 16 / (9 / 16), H: 16 / 9 } : f === "1:1" ? { W: 1, H: 1 } : { W: 16 / 9, H: 1 });
const img = (w: number, h: number) => ({ width: w, height: h });
const many = (n: number, w = 400, h = 400) => Array.from({ length: n }, () => img(w, h));

describe("placeImages", () => {
	it("every placed image keeps its aspect ratio and stays inside the frame", () => {
		for (const format of FORMATS)
			for (const layout of LAYOUTS)
				for (const [w, h] of [
					[400, 400],
					[4000, 200],
					[200, 800],
				] as const)
					for (let n = 1; n <= 6; n++) {
						const { W, H } = frame(format);
						const placed = placeImages({ layout, entrance: "stagger", images: many(n, w, h), format, seconds: 6, textPosition: "bottom" });
						expect(placed.length, `${format} ${layout} ${n}`).toBeGreaterThan(0);
						for (const p of placed) {
							const ratio = (p.w * W) / (p.h * H);
							expect(Math.abs(ratio / (w / h) - 1), `${format} ${layout} ${n} ${w}x${h}`).toBeLessThan(0.005);
							expect(p.x).toBeGreaterThanOrEqual(0);
							expect(p.y).toBeGreaterThanOrEqual(0);
							expect(p.x + p.w).toBeLessThanOrEqual(1 + 1e-9);
							expect(p.y + p.h).toBeLessThanOrEqual(1 + 1e-9);
						}
					}
	});

	it("grid places them all at once, without overlapping", () => {
		const placed = placeImages({ layout: "grid", entrance: "none", images: many(4), format: "16:9", seconds: 6, textPosition: null });
		expect(placed).toHaveLength(4);
		for (const p of placed) expect([p.from, p.to]).toEqual([0, 6]);
		for (let i = 0; i < placed.length; i++)
			for (let j = i + 1; j < placed.length; j++) {
				const a = placed[i]!;
				const b = placed[j]!;
				const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
				expect(apart, `${i} and ${j}`).toBe(true);
			}
		const left = Math.min(...placed.map((p) => p.x));
		const right = Math.max(...placed.map((p) => p.x + p.w));
		expect(Math.abs(left - (1 - right))).toBeLessThan(1e-9);
	});

	it("grid keeps square images together: the gap between columns is the gap between rows", () => {
		for (const format of ["16:9", "9:16"] as const) {
			const { W, H } = frame(format);
			const [a, b, c] = placeImages({ layout: "grid", entrance: "none", images: many(4), format, seconds: 6, textPosition: null });
			const across = (b!.x - (a!.x + a!.w)) * W;
			const down = (c!.y - (a!.y + a!.h)) * H;
			expect(Math.abs(across - down), format).toBeLessThan(1e-9);
			// Y el bloque queda centrado en vertical en el área libre (márgenes iguales arriba y abajo).
			const top = a!.y;
			const bottom = 1 - (c!.y + c!.h);
			expect(Math.abs(top - bottom), format).toBeLessThan(1e-9);
		}
	});

	it("grid leaves the band of a centred text free", () => {
		for (const format of FORMATS) {
			const { H } = frame(format);
			const band = { top: 0.5 - TEXT_SIZE / H, bottom: 0.5 + TEXT_SIZE / H };
			for (let n = 1; n <= 6; n++) {
				const placed = placeImages({ layout: "grid", entrance: "none", images: many(n), format, seconds: 6, textPosition: "center" });
				for (const p of placed) expect(p.y + p.h <= band.top || p.y >= band.bottom, `${format} ${n}`).toBe(true);
			}
		}
	});

	it("sequence splits the scene between the images", () => {
		const placed = placeImages({ layout: "sequence", entrance: "none", images: many(3), format: "9:16", seconds: 6, textPosition: null });
		expect(placed.map((p) => [p.from, p.to])).toEqual([
			[0, 2],
			[2, 4],
			[4, 6],
		]);
	});

	it("center and corner show only the first image", () => {
		expect(placeImages({ layout: "center", entrance: "none", images: many(3), format: "1:1", seconds: 4, textPosition: null }).map((p) => p.index)).toEqual([0]);
		const [corner, ...rest] = placeImages({ layout: "corner", entrance: "none", images: many(3), format: "16:9", seconds: 4, textPosition: "top" });
		expect(rest).toHaveLength(0);
		const { W, H } = frame("16:9");
		expect(Math.abs((1 - corner!.x - corner!.w) * W - CORNER_MARGIN)).toBeLessThan(1e-9);
		expect(Math.abs((1 - corner!.y - corner!.h) * H - CORNER_MARGIN)).toBeLessThan(1e-9);
	});

	it("stagger enters one every 0.3 s with a fade and a 3 % rise", () => {
		const placed = placeImages({ layout: "grid", entrance: "stagger", images: many(3), format: "16:9", seconds: 6, textPosition: null });
		expect(placed.map((p) => p.from)).toEqual([0, IMAGE_STAGGER, 2 * IMAGE_STAGGER]);
		for (const p of placed) {
			expect(p.fade).toBe(IMAGE_STAGGER);
			expect(p.rise).toBe(IMAGE_RISE);
			expect(p.to).toBe(6);
		}
		expect(IMAGE_STAGGER).toBe(0.3);
		expect(IMAGE_RISE).toBe(0.03);
	});

	it("fade enters all at once in 0.4 s; none is there from the start", () => {
		const fade = placeImages({ layout: "grid", entrance: "fade", images: many(3), format: "16:9", seconds: 6, textPosition: null });
		expect(fade.map((p) => [p.from, p.fade, p.rise])).toEqual([
			[0, IMAGE_FADE, 0],
			[0, IMAGE_FADE, 0],
			[0, IMAGE_FADE, 0],
		]);
		expect(IMAGE_FADE).toBe(0.4);
		const none = placeImages({ layout: "grid", entrance: "none", images: many(2), format: "16:9", seconds: 6, textPosition: null });
		expect(none.map((p) => [p.from, p.fade, p.rise])).toEqual([
			[0, 0, 0],
			[0, 0, 0],
		]);
	});

	it("no images, no placements", () => {
		expect(placeImages({ layout: "grid", entrance: "stagger", images: [], format: "16:9", seconds: 6, textPosition: null })).toEqual([]);
	});
});

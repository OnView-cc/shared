// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { unscaledRect } from "./measure";

afterEach(() => vi.restoreAllMocks());

describe("unscaledRect", () => {
	it("gives the box in frame pixels, dividing by the preview's scale", () => {
		const stage = document.createElement("div");
		const el = document.createElement("div");
		stage.appendChild(el);
		vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({ left: 10, top: 20, width: 540, height: 960 } as DOMRect);
		vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 110, top: 70, width: 50, height: 25 } as DOMRect);
		expect(unscaledRect(el, stage, 1080)).toEqual({ x: 200, y: 100, w: 100, h: 50 });
	});

	it("without a measured stage, scale 1", () => {
		const stage = document.createElement("div");
		const el = document.createElement("div");
		expect(unscaledRect(el, stage, 1080)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
	});
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditFrame, safeArea } from "./audit";

/** Cajas simuladas: cada elemento dice su caja en `data-box="x,y,w,h"` (px del escenario 1080×1920). */
let stage: HTMLElement;
let layer: HTMLElement;
beforeEach(() => {
	vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
		const box = (this as HTMLElement).dataset?.box;
		const [x, y, w, h] = box ? box.split(",").map(Number) : this === stage ? [0, 0, 1080, 1920] : [0, 0, 0, 0];
		return { x, y, left: x, top: y, width: w, height: h, right: x! + w!, bottom: y! + h!, toJSON() {} } as DOMRect;
	});
	stage = document.createElement("div");
	stage.className = "motion-stage";
	layer = document.createElement("div");
	layer.className = "motion-layer";
	layer.dataset.moment = "0";
	stage.appendChild(layer);
	document.body.appendChild(stage);
});
afterEach(() => {
	vi.restoreAllMocks();
	stage.remove();
});

function text(content: string, box: string): HTMLElement {
	const el = document.createElement("div");
	el.textContent = content;
	el.dataset.box = box;
	layer.appendChild(el);
	return el;
}
const codes = (format: "9:16" | "16:9" | "1:1" = "9:16", opts = {}) => auditFrame(stage, 0, format, opts).map((i) => i.code);

describe("safeArea", () => {
	it("9:16 keeps clear of the social apps' interface", () => {
		expect(safeArea("9:16")).toEqual({ top: 0.1, right: 0.12, bottom: 0.2, left: 0.06 });
		expect(safeArea("16:9")).toEqual({ top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 });
		expect(safeArea("1:1")).toEqual({ top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 });
	});
});

describe("auditFrame", () => {
	it("a clean frame has no issues", () => {
		text("Hola", "200,600,500,120");
		expect(codes()).toEqual([]);
	});

	it("text_overflow: text wider than its box", () => {
		const el = text("Una frase muy larga", "200,600,500,120");
		Object.defineProperty(el, "clientWidth", { value: 500 });
		Object.defineProperty(el, "scrollWidth", { value: 620 });
		expect(codes()).toContain("text_overflow");
	});

	it("text_overflow: text outside the frame", () => {
		text("Fuera", "900,600,400,120");
		expect(codes()).toContain("text_overflow");
	});

	it("text_overlap: two texts crossing more than 10 % of the smaller", () => {
		text("Uno", "200,600,400,120");
		text("Dos", "300,620,400,120");
		expect(codes()).toContain("text_overlap");
	});

	it("a text inside another text is not an overlap", () => {
		const outer = text("", "200,600,400,120");
		const inner = document.createElement("span");
		inner.textContent = "dentro";
		inner.dataset.box = "220,610,100,60";
		outer.appendChild(inner);
		expect(codes()).not.toContain("text_overlap");
	});

	it("out_of_safe_area: text in the bottom band of 9:16", () => {
		text("Abajo", "200,1700,400,100");
		expect(codes()).toContain("out_of_safe_area");
	});

	it("hidden text is ignored", () => {
		const el = text("Abajo", "200,1700,400,100");
		el.style.opacity = "0";
		expect(codes()).toEqual(expect.not.arrayContaining(["out_of_safe_area"]));
	});

	it("image_missing: a visible image that did not load", () => {
		text("Hola", "200,600,500,120");
		const img = document.createElement("img");
		img.dataset.box = "100,100,300,300";
		Object.defineProperty(img, "complete", { value: true });
		Object.defineProperty(img, "naturalWidth", { value: 0 });
		layer.appendChild(img);
		expect(codes()).toContain("image_missing");
	});

	it("empty_frame: nothing visible of any size", () => {
		const dot = document.createElement("div");
		dot.dataset.box = "10,10,20,20";
		layer.appendChild(dot);
		expect(codes()).toContain("empty_frame");
	});

	it("empty_tail: the scene stops animating more than 1 s before its end", () => {
		text("Hola", "200,600,500,120");
		expect(codes("9:16", { tailGap: 1.5 })).toContain("empty_tail");
		expect(codes("9:16", { tailGap: 0.5 })).not.toContain("empty_tail");
	});
});

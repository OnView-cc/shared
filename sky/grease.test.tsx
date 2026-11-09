// @vitest-environment jsdom
/** El lápiz graso: se traza al dibujarse, salvo con movimiento reducido, donde aparece ya dibujado. */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Grease } from "./grease";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const animate = vi.fn();

function reducedMotion(on: boolean) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: on && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }));
}

beforeEach(() => {
	animate.mockReset();
	(Element.prototype as unknown as { animate: typeof animate }).animate = animate;
	host = document.createElement("div");
	root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

describe("Grease", () => {
	it("draws its stroke when asked", () => {
		reducedMotion(false);
		act(() => root.render(<Grease kind="circle" draw />));
		expect(animate).toHaveBeenCalledTimes(1);
		expect(host.querySelector('[data-grease="circle"]')).not.toBeNull();
	});

	it("appears already drawn with reduced motion", () => {
		reducedMotion(true);
		act(() => root.render(<Grease kind="circle" draw />));
		expect(animate).not.toHaveBeenCalled();
	});

	it("appears already drawn when not asked to draw", () => {
		reducedMotion(false);
		act(() => root.render(<Grease kind="cross" />));
		expect(animate).not.toHaveBeenCalled();
		expect(host.querySelector('[data-grease="cross"]')).not.toBeNull();
	});

	it("is a filled, tapered pencil mark, not a uniform line", () => {
		reducedMotion(false);
		act(() => root.render(<Grease kind="cross" />));
		const marks = host.querySelectorAll("[data-grease-mark]");
		expect(marks).toHaveLength(2);
		marks.forEach((m) => {
			expect(m.getAttribute("fill")).toBe("currentColor");
			expect(m.getAttribute("stroke")).toBeNull();
		});
	});

	it("draws through a mask only when it animates", () => {
		reducedMotion(false);
		act(() => root.render(<Grease kind="circle" draw />));
		expect(host.querySelector("mask")).not.toBeNull();
		act(() => root.render(<Grease kind="circle" />));
		expect(host.querySelector("mask")).toBeNull();
	});

	it("is decoration: hidden from assistive technology", () => {
		reducedMotion(false);
		act(() => root.render(<Grease kind="arrow" />));
		expect(host.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
	});
});

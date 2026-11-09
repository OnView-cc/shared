// @vitest-environment jsdom
/** El cielo de la hora azul: decoración pintada en un lienzo; con movimiento reducido, un solo cuadro. */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlueHourSky } from "./blue-hour-sky";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
let frames: FrameRequestCallback[];

function reducedMotion(on: boolean) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: on && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }));
}

beforeEach(() => {
	frames = [];
	window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
		frames.push(cb);
		return frames.length;
	});
	window.cancelAnimationFrame = vi.fn();
	// jsdom no pinta: un contexto 2D que acepta todo y no hace nada.
	const ctx = new Proxy({} as Record<string, unknown>, {
		get: (target, key) => (key in target ? target[key as string] : key === "createLinearGradient" || key === "createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}),
		set: (target, key, value) => ((target[key as string] = value), true),
	});
	HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	host = document.createElement("div");
	root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

const runFrame = (t: number) => act(() => frames.shift()?.(t));

describe("BlueHourSky", () => {
	it("is a decorative canvas, hidden from assistive technology", () => {
		reducedMotion(false);
		act(() => root.render(<BlueHourSky />));
		const canvas = host.querySelector("canvas");
		expect(canvas).not.toBeNull();
		expect(canvas?.getAttribute("aria-hidden")).toBe("true");
	});

	it("with reduced motion paints a single frame and stops", () => {
		reducedMotion(true);
		act(() => root.render(<BlueHourSky />));
		expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
		runFrame(16);
		expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
		expect(host.querySelector("canvas")?.getAttribute("data-ready")).toBe("true");
	});

	it("a fixed progress paints once, even with motion allowed", () => {
		reducedMotion(false);
		act(() => root.render(<BlueHourSky progress={0.6} />));
		runFrame(16);
		expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
	});

	it("without a fixed progress, the lights keep coming on frame after frame", () => {
		reducedMotion(false);
		act(() => root.render(<BlueHourSky />));
		runFrame(16);
		runFrame(32);
		expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(3);
	});
});

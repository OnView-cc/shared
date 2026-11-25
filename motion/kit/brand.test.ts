// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { LogoReveal, Morph } from "./brand";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());

describe("LogoReveal", () => {
	it("draws the requested kit logo, emits logo when it lands, deterministic", () => {
		const h = sceneHarness({ at: 1, seconds: 3 });
		cleanup = h.cleanup;
		const l = LogoReveal(h.ctx, { logo: "closing", mode: "assemble", at: 1.5, line: "¡Tendencia en cada rincón!" });
		expect(l.el.querySelector("img")?.getAttribute("src")).toBe("closing.svg");
		expect(l.el.textContent).toContain("¡Tendencia en cada rincón!");
		expect(h.events().map((e) => e.kind)).toEqual(["logo"]);
		expectDeterministic(h.tl, h.stage, [1, 1.6, 2.5, 3.9], expect);
	});

	it("without that logo in the kit, falls back to another one", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		h.ctx.doc.brand.lightLogo = null;
		const l = LogoReveal(h.ctx, { logo: "light", mode: "pop", at: 0 });
		expect(l.el.querySelector("img")?.getAttribute("src")).toBe("logo.png");
	});
});

describe("Morph", () => {
	it("cross-fades from one element into the other at its time", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const a = document.createElement("div");
		const b = document.createElement("div");
		h.ctx.el.append(a, b);
		Morph(h.ctx, { from: a, to: b, at: 1, duration: 1 });
		h.tl.seek(0.5, false);
		expect([Number(a.style.opacity), Number(b.style.opacity)]).toEqual([1, 0]);
		h.tl.seek(2.5, false);
		expect([Number(a.style.opacity), Number(b.style.opacity)]).toEqual([0, 1]);
		expectDeterministic(h.tl, h.stage, [0, 1.3, 2.5], expect);
	});
});

describe("Morph measures where the pieces are at its time, in frame pixels", () => {
	it("asks ctx.rectAt for both pieces at its start", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const a = document.createElement("div");
		const b = document.createElement("div");
		h.ctx.el.append(a, b);
		const asked: [HTMLElement, number][] = [];
		h.ctx.rectAt = (el, t) => (asked.push([el, t]), { x: 0, y: 0, w: 0, h: 0 });
		let ready = () => {};
		h.ctx.onReady = (fn) => void (ready = fn);
		Morph(h.ctx, { from: a, to: b, at: 1.5 });
		ready();
		expect(asked).toEqual([
			[a, 1.5],
			[b, 1.5],
		]);
	});
});

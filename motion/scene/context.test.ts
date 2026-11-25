// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { gsap } from "gsap";
import type { BlockCtx } from "../registry";
import { KIT_VERSION, parseBlockParams, type SceneParams } from "../types";
import { createHandoffRegistry, sceneContext } from "./context";

const params: SceneParams = { code: "x", texts: { headline: "Hola" }, kitVersion: KIT_VERSION, fallback: { block: "text", params: parseBlockParams("text", {}) } };

function base(at = 10, seconds = 4): BlockCtx {
	const el = document.createElement("div");
	return {
		el,
		tl: gsap.timeline({ paused: true }),
		moment: { shotId: "a", block: "scene", params, at, seconds, transition: "cut", images: [{ id: "img1", src: "a.png", width: 10, height: 10 }, { id: "img2", src: "b.png", width: 10, height: 10 }] },
		doc: { width: 1080, height: 1920 } as never,
		u: 10.8,
		orientation: "portrait",
		mode: "export",
		beat: (n) => at + n * 0.5,
		beatSeconds: 0.5,
		cues: () => null,
		ink: "#fff",
		style: {} as never,
		background: { kind: "brand", color: "#000" } as never,
		font: (f) => f,
		onReady: () => {},
	};
}

describe("sceneContext", () => {
	it("random(seed) repeats for the same seed and differs for another", () => {
		const { ctx } = sceneContext(base(), params, createHandoffRegistry());
		const a = ctx.random(7), b = ctx.random(7), c = ctx.random(8);
		const take = (f: () => number) => Array.from({ length: 5 }, f);
		const xs = take(a);
		expect(take(b)).toEqual(xs);
		expect(take(c)).not.toEqual(xs);
		for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
	});

	it("event stores time relative to the moment and numbers n by kind in time order", () => {
		const { ctx, events } = sceneContext(base(10, 4), params, createHandoffRegistry());
		ctx.event("click", 13);
		ctx.event("land", 11.5);
		ctx.event("click", 11);
		expect(events()).toEqual([
			{ kind: "click", at: 1, n: 0 },
			{ kind: "land", at: 1.5, n: 0 },
			{ kind: "click", at: 3, n: 1 },
		]);
	});

	it("drops events outside the moment", () => {
		const { ctx, events } = sceneContext(base(10, 4), params, createHandoffRegistry());
		ctx.event("click", 9.5);
		ctx.event("click", 14.5);
		expect(events()).toEqual([]);
	});

	it("text, image, at, seconds, width and height", () => {
		const { ctx } = sceneContext(base(10, 4), params, createHandoffRegistry());
		expect(ctx.text("headline")).toBe("Hola");
		expect(ctx.text("missing")).toBe("");
		expect(ctx.image(1)?.id).toBe("img2");
		expect(ctx.image("img1")?.src).toBe("a.png");
		expect(ctx.image("zz")).toBeNull();
		expect([ctx.at, ctx.seconds, ctx.width, ctx.height]).toEqual([10, 4, 1080, 1920]);
	});

	it("receive of a name never given is null; a given element is received into the next layer", () => {
		const reg = createHandoffRegistry();
		const first = sceneContext(base(0, 2), params, reg).ctx;
		const second = sceneContext(base(2, 2), params, reg).ctx;
		expect(second.receive("nope")).toBeNull();
		const box = document.createElement("div");
		first.el.appendChild(box);
		first.handoff("box", box);
		expect(second.receive("box")).toBe(box);
		expect(box.parentElement).toBe(second.el);
		expect(second.receive("box")).toBeNull();
	});
});

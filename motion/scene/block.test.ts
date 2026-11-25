// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type Composition } from "../../video/compose";
import { createMotion } from "../index";
import { KIT_VERSION, parseBlockParams, type SceneParams } from "../types";

let root: HTMLElement | null = null;
afterEach(() => root?.remove());

const scene = (code: string, texts: Record<string, string> = {}): SceneParams => ({ code, texts, kitVersion: KIT_VERSION, fallback: { block: "text", params: parseBlockParams("text", { lines: ["Respaldo"] }) } });

/** Una composición de `n` momentos de 2 s (120 BPM, 4 golpes); los de `scenes` pasan a escena. */
function comp(n: number, scenes: Record<number, SceneParams>): Composition {
	const c = composeVideo({
		format: "16:9", voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine: "", tempo: { bpm: 120, offset: 0 }, template: { id: "software-launch", voice: false },
		shots: Array.from({ length: n }, (_, i) => ({ id: `m${i}`, position: i, seconds: 2, block: "text" as const, params: parseBlockParams("text", { lines: [`Line ${i}`] }), beats: 4, transition: "cut" as const, voice: null, images: [] })),
		music: null, sfx: [], brand: null, limits: { watermark: false },
	});
	c.moments = c.moments.map((m, i) => (scenes[i] ? { ...m, block: "scene", params: scenes[i]! } : m));
	return c;
}

function mount(c: Composition, forceFallback?: number[]) {
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export", imageWaitMs: 5, forceFallback });
}

const layer = (i: number) => root!.querySelector<HTMLElement>(`.motion-layer[data-moment="${i}"]`)!;

const VALID = `export default function scene(ctx, kit) {
	kit.KineticText(ctx, { text: ctx.text("headline"), accent: "fácil", at: ctx.beat(0) });
	const c = kit.Cursor(ctx, {});
	c.tap({ x: 50, y: 50 }, { at: ctx.beat(2) });
}`;

describe("scene block", () => {
	it("mounts a valid scene and reports its events", async () => {
		const m = mount(comp(2, { 1: scene(VALID, { headline: "Comprar es fácil" }) }));
		expect(layer(1).dataset.block).toBe("scene");
		expect(layer(1).textContent).toContain("fácil");
		expect(m.failed()).toEqual([]);
		const ev = m.events();
		expect(ev).toEqual([{ moment: 1, events: [{ kind: "reveal", at: expect.any(Number), n: 0 }, { kind: "click", at: 1, n: 0 }] }]);
		await m.seek(3.2);
	});

	it("compile error falls back to the classic block", () => {
		const m = mount(comp(2, { 0: scene("export default function scene(ctx, kit) { const = ; }") }));
		expect(layer(0).dataset.block).toBe("text");
		expect(layer(0).textContent).toContain("Respaldo");
		expect(m.failed()).toEqual([0]);
		expect(m.issues()).toEqual([{ moment: 0, code: "compile", message: expect.any(String) }]);
	});

	it("throw at mount falls back and reports mount", () => {
		const m = mount(comp(1, { 0: scene("export default function scene(ctx, kit) { kit.KineticText(ctx, { text: 'x', at: 0 }); throw new Error('boom'); }") }));
		expect(layer(0).dataset.block).toBe("text");
		expect(layer(0).querySelector(".kit-text")).toBeNull();
		expect(m.issues()[0]).toEqual({ moment: 0, code: "mount", message: "boom" });
	});

	it("forceFallback skips the code entirely", () => {
		const m = mount(comp(1, { 0: scene("export default function scene(ctx, kit) { throw new Error('never'); }") }), [0]);
		expect(layer(0).dataset.block).toBe("text");
		expect(m.failed()).toEqual([0]);
		expect(m.issues()).toEqual([]);
	});

	it("overrun is reported", () => {
		const m = mount(comp(2, { 0: scene("export default function scene(ctx, kit) { const el = ctx.el.ownerDocument.createElement('div'); ctx.el.appendChild(el); ctx.tl.to(el, { opacity: 0.5, duration: 1 }, ctx.at + ctx.seconds + 0.5); }") }));
		expect(m.issues()).toEqual([{ moment: 0, code: "overrun", message: expect.any(String) }]);
		expect(layer(0).dataset.block).toBe("scene");
	});

	it("a throw during seek is reported and rethrown in export", async () => {
		const m = mount(comp(2, { 1: scene("export default function scene(ctx, kit) { const el = ctx.el.ownerDocument.createElement('div'); ctx.el.appendChild(el); ctx.tl.to(el, { opacity: 0.5, duration: 0.5, onUpdate() { throw new Error('late'); } }, ctx.at + 0.5); }") }));
		await expect(m.seek(2.8)).rejects.toMatchObject({ name: "SceneRuntimeError", moment: 1 });
		expect(m.issues().at(-1)).toMatchObject({ moment: 1, code: "seek" });
	});

	it("sceneEnds says until when each mounted scene animates", () => {
		const m = mount(comp(2, { 1: scene("export default function scene(ctx, kit) { const el = ctx.el.ownerDocument.createElement('div'); ctx.el.appendChild(el); ctx.tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 }, ctx.at + 0.25); }") }));
		expect(m.sceneEnds()).toEqual({ 1: 2.75 });
	});

	it("handoff gives the next scene its own copy of the piece", () => {
		const give = "export default function scene(ctx, kit) { const box = ctx.el.ownerDocument.createElement('div'); box.className = 'carried'; ctx.el.appendChild(box); ctx.handoff('box', box); }";
		const take = "export default function scene(ctx, kit) { const box = ctx.receive('box'); if (box) box.dataset.got = 'yes'; }";
		mount(comp(2, { 0: scene(give), 1: scene(take) }));
		expect(layer(1).querySelector<HTMLElement>(".carried")!.dataset.got).toBe("yes");
		expect(layer(0).querySelector<HTMLElement>(".carried")!.dataset.got).toBeUndefined();
	});
});

describe("final review fixes (handoff, errors after mount)", () => {
	it("handoff: the giving scene keeps its piece; the next one gets a copy as the piece ends", () => {
		const give = "export default function scene(ctx, kit) { const box = ctx.el.ownerDocument.createElement('div'); box.className = 'carried'; ctx.el.appendChild(box); ctx.tl.fromTo(box, { opacity: 1 }, { opacity: 0.5, duration: 1, immediateRender: false }, ctx.at + 0.5); ctx.handoff('box', box); }";
		const take = "export default function scene(ctx, kit) { const box = ctx.receive('box'); if (box) box.dataset.got = 'yes'; }";
		mount(comp(2, { 0: scene(give), 1: scene(take) }));
		const original = layer(0).querySelector<HTMLElement>(".carried");
		const copy = layer(1).querySelector<HTMLElement>(".carried");
		expect(original).not.toBeNull();
		expect(copy).not.toBeNull();
		expect(copy).not.toBe(original);
		expect(copy!.dataset.got).toBe("yes");
		expect(copy!.style.opacity).toBe("0.5");
	});

	it("a scene that throws in onReady: in export, ready rejects with its moment and the other moments still fit", async () => {
		const bad = "export default function scene(ctx, kit) { ctx.onReady(() => { throw new Error('late fit'); }); }";
		const m = mount(comp(2, { 0: scene(bad) }));
		await expect(m.ready).rejects.toMatchObject({ name: "SceneRuntimeError", moment: 0 });
		expect(m.issues()).toContainEqual({ moment: 0, code: "mount", message: "late fit" });
	});

});

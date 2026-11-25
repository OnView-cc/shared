// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Cursor } from "./cursor";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());

describe("Cursor", () => {
	it("tap emits click at exactly the tap time", () => {
		const h = sceneHarness({ at: 2, seconds: 4 });
		cleanup = h.cleanup;
		const c = Cursor(h.ctx, { start: { x: 10, y: 10 } });
		c.moveTo({ x: 50, y: 40 }, { at: 2.2 });
		c.tap({ x: 50, y: 40 }, { at: 3.1 });
		expect(h.events()).toEqual([{ kind: "click", at: 1.1, n: 0 }]);
	});

	it("drag emits swipe and type emits one type event every 3 letters", () => {
		const h = sceneHarness({ seconds: 6 });
		cleanup = h.cleanup;
		const c = Cursor(h.ctx, { kind: "finger" });
		c.drag({ x: 20, y: 50 }, { x: 80, y: 50 }, { at: 0.5 });
		const field = document.createElement("div");
		h.ctx.el.appendChild(field);
		c.type(field, "Guitarra", { at: 2, cps: 10 });
		const kinds = h.events().map((e) => e.kind);
		expect(kinds.filter((k) => k === "swipe")).toHaveLength(1);
		expect(kinds.filter((k) => k === "type")).toHaveLength(3);
		h.tl.seek(5, false);
		expect(field.textContent).toBe("Guitarra");
		h.tl.seek(1, false);
		expect(field.textContent).toBe("");
	});

	it("is deterministic across moves, taps and typing", () => {
		const h = sceneHarness({ seconds: 6 });
		cleanup = h.cleanup;
		const c = Cursor(h.ctx, {});
		const field = document.createElement("div");
		h.ctx.el.appendChild(field);
		c.moveTo({ x: 30, y: 30 }, { at: 0.2 });
		c.tap({ x: 30, y: 30 }, { at: 1 });
		c.moveTo({ x: 60, y: 70 }, { at: 1.5, duration: 1 });
		c.type(field, "Hola", { at: 3 });
		expectDeterministic(h.tl, h.stage, [0, 0.6, 1.05, 1.9, 3.2, 5], expect);
	});
});

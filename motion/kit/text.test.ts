// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Counter, KineticText } from "./text";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());

describe("KineticText", () => {
	it("is deterministic and adds no nodes when seeking", () => {
		const h = sceneHarness({ texts: { headline: "Todo lo que necesitas" } });
		cleanup = h.cleanup;
		KineticText(h.ctx, { text: h.ctx.text("headline"), accent: "necesitas", at: 0.2 });
		expectDeterministic(h.tl, h.stage, [0, 0.3, 0.9, 2], expect);
	});

	it("colours the accent word with the kit accent (case and accents ignored)", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const t = KineticText(h.ctx, { text: "Comprar es muy fácil", accent: "FACIL", at: 0 });
		h.tl.seek(3, false);
		const words = [...t.el.querySelectorAll<HTMLElement>(".kit-word")];
		expect(words.map((w) => w.textContent)).toEqual(["Comprar", "es", "muy", "fácil"]);
		expect(words[3]!.style.color).toBe("rgb(241, 132, 77)");
		expect(words[0]!.style.color).not.toBe("rgb(241, 132, 77)");
	});

	it("emits reveal once per accent word, when it appears", () => {
		const h = sceneHarness({ at: 2, seconds: 4 });
		cleanup = h.cleanup;
		KineticText(h.ctx, { text: "Rápido fácil seguro", accent: "seguro", at: 2.5, stagger: 1 });
		const ev = h.events();
		expect(ev).toHaveLength(1);
		expect(ev[0]!.kind).toBe("reveal");
		expect(ev[0]!.at).toBeCloseTo(0.5 + 2 * 0.5, 3);
	});

	it("words are hidden before at and visible after", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const t = KineticText(h.ctx, { text: "uno dos", at: 1 });
		h.tl.seek(0.5, false);
		expect(Number(t.el.querySelectorAll<HTMLElement>(".kit-word")[0]!.style.opacity)).toBe(0);
		h.tl.seek(3, false);
		expect(Number(t.el.querySelectorAll<HTMLElement>(".kit-word")[1]!.style.opacity)).toBe(1);
	});

	it("exit hides the text", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const t = KineticText(h.ctx, { text: "uno", at: 0 });
		t.exit({ at: 2 });
		h.tl.seek(3.5, false);
		expect(Number(t.el.style.opacity)).toBe(0);
	});
});

describe("Counter", () => {
	it("shows to formatted at the end, and from at the start", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const c = Counter(h.ctx, { from: 0, to: 1200, at: 0.5, duration: 2, format: "money" });
		h.tl.seek(0.2, false);
		expect(c.el.textContent).toBe("$0");
		h.tl.seek(3.9, false);
		expect(c.el.textContent).toBe("$1,200");
		expectDeterministic(h.tl, h.stage, [0, 1, 2, 3.5], expect);
	});

	it("percent and int with prefix and suffix", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const a = Counter(h.ctx, { from: 0, to: 45, at: 0, duration: 1, format: "percent" });
		const b = Counter(h.ctx, { from: 0, to: 3, at: 0, duration: 1, prefix: "x", suffix: " apps" });
		h.tl.seek(3, false);
		expect(a.el.textContent).toBe("45%");
		expect(b.el.textContent).toBe("x3 apps");
	});
});

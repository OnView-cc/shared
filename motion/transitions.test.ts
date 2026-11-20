// @vitest-environment jsdom
import { gsap } from "gsap";
import { describe, expect, it } from "vitest";
import type { Moment } from "../video/compose";
import { wireTransitions } from "./transitions";
import { TRANSITIONS, type Transition } from "./types";

const BEAT = 0.5;

function build(transition: Transition, secondsEach = 2, n = 3) {
	const moments: Moment[] = Array.from({ length: n }, (_, i) => ({
		shotId: `m${i}`,
		block: "text",
		params: { lines: [], color: null },
		at: i * secondsEach,
		seconds: secondsEach,
		transition: i === n - 1 ? "cut" : transition,
		images: [],
	}));
	const layers = moments.map(() => document.createElement("div"));
	const tl = gsap.timeline({ paused: true });
	wireTransitions(tl, layers, moments, BEAT);
	tl.set({}, {}, n * secondsEach);
	// Lo que se ve: una capa oculta es «hidden» tenga los restos que tenga.
	// Lo que no cambia nada (`translate(0, 0)`, `none`) se escribe vacío.
	const plain = (v: string) => (/^(none|translate\(0(px)?, 0(px)?\))?$/.test(v) ? "" : v);
	const state = () => layers.map((l) => (l.style.visibility === "hidden" || Number(l.style.opacity || "1") <= 0.001 ? "hidden" : [l.style.opacity, plain(l.style.transform), plain(l.style.clipPath), plain(l.style.filter)].join("|")));
	const visible = () => layers.filter((l) => l.style.visibility !== "hidden" && Number(l.style.opacity || "1") > 0.001).length;
	return { tl, state, visible };
}

const TIMES = [0.1, 1.6, 1.8, 1.95, 2.0, 2.05, 2.3, 2.6, 3.9, 4.2];

describe("the transitions", () => {
	for (const t of TRANSITIONS) {
		it(`${t}: seeking back gives the same frame as seeking there directly`, () => {
			const a = build(t);
			const direct = TIMES.map((time) => {
				a.tl.seek(time, false);
				return a.state();
			});
			const b = build(t);
			b.tl.seek(5.9, false);
			const back = [...TIMES].reverse().map((time) => {
				b.tl.seek(time, false);
				return b.state();
			});
			expect(back.reverse()).toEqual(direct);
		});
	}

	for (const t of ["cut", "punch"] as const) {
		it(`${t}: never shows two moments at once`, () => {
			const { tl, visible } = build(t);
			for (let time = 0; time < 6; time += 0.05) {
				tl.seek(time, false);
				expect(visible()).toBeLessThanOrEqual(1);
			}
		});
	}

	it("punch: the moment that comes in starts a bit larger and settles", () => {
		const { tl, state } = build("punch");
		tl.seek(2.02, false);
		expect(state()[1]).toMatch(/scale\(1\.0[1-8]/);
		tl.seek(2.6, false);
		expect(state()[1]).not.toMatch(/scale\(1\.0[1-8]/);
	});

	it("fade: mid-window both moments show", () => {
		const { tl, visible } = build("fade");
		tl.seek(2.0, false);
		expect(visible()).toBe(2);
	});

	it("fade lasts two beats around the cut", () => {
		const { tl, visible } = build("fade", 4);
		tl.seek(4 - 0.45, false);
		expect(visible()).toBe(2);
		tl.seek(4 + 0.45, false);
		expect(visible()).toBe(2);
		tl.seek(4 + 0.6, false);
		expect(visible()).toBe(1);
	});

	for (const t of ["wipe", "slide", "fade", "blur"] as const) {
		it(`${t}: with one-beat moments, never three at once`, () => {
			const { tl, visible } = build(t, BEAT, 5);
			for (let time = 0; time < 5 * BEAT; time += 0.02) {
				tl.seek(time, false);
				expect(visible()).toBeLessThanOrEqual(2);
			}
		});
	}

	for (const t of ["wipe", "slide"] as const) {
		it(`${t}: the moment coming in moves during the window and rests after`, () => {
			const { tl, state } = build(t);
			tl.seek(2.0, false);
			const during = state()[1]!;
			tl.seek(2.9, false);
			const after = state()[1]!;
			expect(during).not.toEqual(after);
		});
	}
});

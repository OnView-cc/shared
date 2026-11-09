// @vitest-environment jsdom
/** Un número que cambia lo hace de golpe, con un resplandor; nunca rueda por los valores intermedios. */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrikeNumber } from "./strike-number";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
	host = document.createElement("div");
	root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

describe("StrikeNumber", () => {
	it("shows the first value quietly", () => {
		act(() => root.render(<StrikeNumber value={200} format={(n) => String(n)} />));
		expect(host.textContent).toBe("200");
		expect(host.querySelector(".sk-strike")).toBeNull();
	});

	it("jumps straight to the new value and strikes it, with no value in between", () => {
		const format = vi.fn((n: number) => String(n));
		act(() => root.render(<StrikeNumber value={200} format={format} />));
		act(() => root.render(<StrikeNumber value={140} format={format} />));
		expect(host.textContent).toBe("140");
		expect(host.querySelector(".sk-strike")).not.toBeNull();
		expect(new Set(format.mock.calls.map(([n]) => n))).toEqual(new Set([200, 140]));
	});
});

// @vitest-environment jsdom
/**
 * Los hooks de Ventana (los que sobreviven a Feed vertical): la anchura, el
 * movimiento reducido, el paso con flechas, el aviso que se apaga solo y la
 * parada de la URL. Se prueban con un componente mínimo, sin Testing Library.
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlash, useNarrow, useReducedMotion, useScrollToStop, useStepKeys, FLASH_MS } from "./hooks";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

function stubMedia(matching: (query: string) => boolean) {
	window.matchMedia = ((query: string) => ({
		matches: matching(query),
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	})) as unknown as typeof window.matchMedia;
}

function render(fn: () => unknown): { current: unknown } {
	const out: { current: unknown } = { current: undefined };
	function Probe() {
		out.current = fn();
		return null;
	}
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(createElement(Probe)));
	return out;
}

beforeEach(() => stubMedia(() => false));
afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = host = undefined;
	vi.useRealTimers();
});

describe("useNarrow y useReducedMotion", () => {
	it("useNarrow sigue a matchMedia con la consulta que se le da", () => {
		stubMedia((q) => q === "(max-width: 63.9rem)");
		expect(render(() => useNarrow("(max-width: 63.9rem)")).current).toBe(true);
	});
	it("useNarrow, por defecto, pregunta por menos de 48rem", () => {
		stubMedia((q) => q === "(max-width: 47.9rem)");
		expect(render(() => useNarrow()).current).toBe(true);
	});
	it("useReducedMotion pregunta por prefers-reduced-motion", () => {
		stubMedia((q) => q === "(prefers-reduced-motion: reduce)");
		expect(render(() => useReducedMotion()).current).toBe(true);
	});
});

describe("useStepKeys", () => {
	it("abajo pasa a la siguiente y no se sale del final", () => {
		const onIndex = vi.fn();
		const handler = render(() => useStepKeys({ count: 3, index: 1, onIndex })).current as (e: KeyboardEvent) => void;
		handler(new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(onIndex).toHaveBeenCalledWith(2);
		const atEnd = vi.fn();
		const last = render(() => useStepKeys({ count: 3, index: 2, onIndex: atEnd })).current as (e: KeyboardEvent) => void;
		last(new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(atEnd).not.toHaveBeenCalled();
	});
});

describe("useFlash", () => {
	it("se enciende y se apaga solo a los FLASH_MS", () => {
		vi.useFakeTimers();
		const out = render(() => useFlash());
		const [, flash] = out.current as [boolean, () => void];
		act(() => flash());
		expect((out.current as [boolean])[0]).toBe(true);
		act(() => vi.advanceTimersByTime(FLASH_MS));
		expect((out.current as [boolean])[0]).toBe(false);
	});
});

describe("useScrollToStop", () => {
	it("lleva a la parada de la URL cuando está lista", () => {
		const target = document.createElement("section");
		target.id = "members";
		target.scrollIntoView = vi.fn();
		document.body.append(target);
		window.history.replaceState(null, "", "#members");
		const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
			cb(0);
			return 0;
		});
		render(() => useScrollToStop(true));
		expect(target.scrollIntoView).toHaveBeenCalled();
		raf.mockRestore();
		target.remove();
		window.history.replaceState(null, "", "#");
	});
});

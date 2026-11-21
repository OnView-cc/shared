// @vitest-environment jsdom
/** Mark, AiMark y Wordmark de Ventana. */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { AiMark, Mark, Wordmark } from "./marks";
import { MARK_COLORS } from "./mark";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function setReducedMotion(on: boolean) {
	window.matchMedia = ((query: string) => ({
		matches: on && query.includes("prefers-reduced-motion"),
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	})) as unknown as typeof window.matchMedia;
}

function unmount() {
	act(() => root?.unmount());
	root = null;
	host?.remove();
	host = null;
}

function mount(node: React.ReactNode) {
	unmount();
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
	return host.firstElementChild as HTMLElement;
}

afterEach(unmount);

describe("Mark", () => {
	it("pinta los dos marcos con el color del tono, oculta a lectores, y className se suma a vn-mark en el svg", () => {
		const svg = mount(<Mark className="size-8" tone="paper" />);
		expect(svg.tagName.toLowerCase()).toBe("svg");
		expect(svg.getAttribute("aria-hidden")).toBe("true");
		// Se suma, no sustituye: como AiMark y Wordmark (la utilidad del consumidor gana porque Ventana va en una capa)
		expect(svg.getAttribute("class")).toBe("vn-mark size-8");
		const rects = svg.querySelectorAll("rect");
		expect(rects).toHaveLength(2);
		rects.forEach((r) => expect(r.getAttribute("fill")).toBe(MARK_COLORS.paper));
	});
});

describe("AiMark", () => {
	it("en color es un span vn-ai con aro y núcleo, oculto a lectores, con el espectro en línea", () => {
		setReducedMotion(false);
		const el = mount(<AiMark className="size-6" />);
		expect(el.tagName.toLowerCase()).toBe("span");
		expect(el.classList.contains("vn-ai")).toBe(true);
		expect(el.classList.contains("size-6")).toBe(true);
		expect(el.getAttribute("aria-hidden")).toBe("true");
		expect(el.children).toHaveLength(2);
		expect(el.children[0].classList.contains("vn-ai__ring")).toBe(true);
		expect(el.children[1].classList.contains("vn-ai__core")).toBe(true);
		expect(el.getAttribute("style")).toMatch(/--vn-ai-spectrum:\s*conic-gradient\(/);
	});

	it("el plano (mono) suma className a vn-ai-mono, como el de color", () => {
		expect(mount(<AiMark mono className="size-6" />).getAttribute("class")).toBe("vn-ai-mono size-6");
		unmount();
		expect(mount(<AiMark mono />).getAttribute("class")).toBe("vn-ai-mono");
		unmount();
		expect(mount(<Mark />).getAttribute("class")).toBe("vn-mark");
	});

	it("thinking añade vn-ai--thinking", () => {
		setReducedMotion(false);
		expect(mount(<AiMark thinking />).classList.contains("vn-ai--thinking")).toBe(true);
	});

	it("con movimiento reducido thinking se queda quieto", () => {
		setReducedMotion(true);
		expect(mount(<AiMark thinking />).classList.contains("vn-ai--thinking")).toBe(false);
	});

	it("mono pinta el svg plano y ningún conic-gradient", () => {
		setReducedMotion(false);
		const el = mount(<AiMark mono tone="paper" />);
		expect(el.tagName.toLowerCase()).toBe("svg");
		expect(el.outerHTML).not.toContain("conic-gradient");
		expect(el.querySelectorAll("circle")).toHaveLength(2);
	});

	it("sobre papel conserva el espectro y el núcleo es del papel", () => {
		setReducedMotion(false);
		const el = mount(<AiMark tone="paper" />);
		expect(el.getAttribute("style")).toContain("conic-gradient(");
		expect(el.classList.contains("vn-ai--paper")).toBe(true);
	});

	it("nunca lleva vn-glass", () => {
		setReducedMotion(false);
		expect(mount(<AiMark thinking />).outerHTML).not.toContain("vn-glass");
	});
});

describe("Wordmark", () => {
	it("es un enlace con su href, la marca y el nombre del producto", () => {
		const a = mount(<Wordmark href="/es" className="extra" />);
		expect(a.tagName.toLowerCase()).toBe("a");
		expect(a.getAttribute("href")).toBe("/es");
		expect(a.classList.contains("vn-wordmark")).toBe(true);
		expect(a.classList.contains("extra")).toBe(true);
		expect(a.textContent).toBe("OnView");
		expect(a.querySelector("svg")).not.toBeNull();
		expect(a.outerHTML).not.toContain("vn-glass");
	});
});

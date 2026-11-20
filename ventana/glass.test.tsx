// @vitest-environment jsdom
/**
 * Vidrio, scrim y brillo de Ventana: las clases que pinta cada pieza y lo que
 * pasa con lo que sobra (más de tres colores) o falta (ninguno).
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Glass, Glow, Scrim } from "./glass";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement;

function mount(node: React.ReactNode) {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
}

afterEach(() => {
	act(() => root?.unmount());
	root = null;
	host?.remove();
});

describe("Glass", () => {
	it("es fino por defecto", () => {
		mount(<Glass>hola</Glass>);
		const el = host.firstElementChild!;
		expect(el.tagName).toBe("DIV");
		expect(el.classList.contains("vn-glass")).toBe(true);
		expect(el.classList.contains("vn-glass--thin")).toBe(true);
		expect(el.classList.contains("vn-glass--solid")).toBe(false);
	});

	it("as pinta otra etiqueta y pasa sus atributos", () => {
		mount(<Glass as="nav" aria-label="Principal">x</Glass>);
		const el = host.firstElementChild!;
		expect(el.tagName).toBe("NAV");
		expect(el.getAttribute("aria-label")).toBe("Principal");
	});

	it("respeta el grosor, solid y la clase del consumidor", () => {
		mount(<Glass grade="thick" solid className="mia">x</Glass>);
		const el = host.firstElementChild!;
		expect(el.classList.contains("vn-glass--thick")).toBe(true);
		expect(el.classList.contains("vn-glass--solid")).toBe(true);
		expect(el.classList.contains("mia")).toBe(true);
	});
});

describe("Scrim", () => {
	it("es decorativo y lleva la clase de su borde", () => {
		mount(<Scrim />);
		const el = host.firstElementChild!;
		expect(el.getAttribute("aria-hidden")).toBe("true");
		expect(el.classList.contains("vn-scrim--bottom")).toBe(true);
		act(() => root!.render(<Scrim edge="both" />));
		expect(host.firstElementChild!.classList.contains("vn-scrim--both")).toBe(true);
	});
});

describe("Glow", () => {
	it("con cinco colores sólo fija tres variables", () => {
		mount(<Glow colors={["#111111", "#222222", "#333333", "#444444", "#555555"]} />);
		const el = host.firstElementChild as HTMLElement;
		expect(el.getAttribute("aria-hidden")).toBe("true");
		expect(el.style.getPropertyValue("--vn-glow-1")).toBe("#111111");
		expect(el.style.getPropertyValue("--vn-glow-3")).toBe("#333333");
		expect(el.style.getPropertyValue("--vn-glow-4")).toBe("");
		expect(el.hasAttribute("data-neutral")).toBe(false);
	});

	it("sin colores es neutro", () => {
		mount(<Glow />);
		const el = host.firstElementChild as HTMLElement;
		expect(el.hasAttribute("data-neutral")).toBe(true);
		expect(el.style.getPropertyValue("--vn-glow-1")).toBe("");
	});
});

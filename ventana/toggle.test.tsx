// @vitest-environment jsdom
/** Interruptor y casilla de Ventana: teclado, deshabilitado, texto clicable y piezas sólidas. */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Check, Switch } from "./toggle";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

function mount(node: React.ReactElement): HTMLElement {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = host = undefined;
	document.body.innerHTML = "";
});

describe("Switch", () => {
	it("es un botón con role=switch, aria-checked y nombre accesible", () => {
		mount(<Switch checked label="Subtítulos" onChange={() => {}} />);
		const sw = document.querySelector<HTMLButtonElement>("button")!;
		expect(sw.getAttribute("role")).toBe("switch");
		expect(sw.getAttribute("aria-checked")).toBe("true");
		expect(sw.getAttribute("aria-label")).toBe("Subtítulos");
	});

	it("un botón enfocado alterna una sola vez con el clic nativo (Espacio y Enter)", () => {
		// Límite de jsdom: no convierte Espacio ni Enter en un clic. El contrato nativo
		// es que un botón enfocado activado por teclado dispara click(); eso se prueba aquí.
		const onChange = vi.fn();
		mount(<Switch checked={false} label="x" onChange={onChange} />);
		const sw = document.querySelector("button")!;
		sw.focus();
		expect(document.activeElement).toBe(sw);
		act(() => sw.click());
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it("un clic alterna", () => {
		const onChange = vi.fn();
		mount(<Switch checked label="x" onChange={onChange} />);
		act(() => document.querySelector("button")!.click());
		expect(onChange).toHaveBeenCalledWith(false);
	});

	it("deshabilitado no llama con clic", () => {
		const onChange = vi.fn();
		mount(<Switch checked={false} disabled label="x" onChange={onChange} />);
		const sw = document.querySelector("button")!;
		expect(sw.disabled).toBe(true);
		act(() => sw.click());
		expect(onChange).not.toHaveBeenCalled();
	});

	it("es sólido: nunca lleva vn-glass", () => {
		mount(<Switch checked label="x" onChange={() => {}} />);
		expect(document.querySelector(".vn-glass")).toBeNull();
		expect(document.querySelector(".vn-switch")).not.toBeNull();
	});

	it("respeta el id", () => {
		mount(<Switch id="s1" checked label="x" onChange={() => {}} />);
		expect(document.querySelector("button")!.id).toBe("s1");
	});
});

describe("Check", () => {
	it("un clic en el texto alterna", () => {
		const onChange = vi.fn();
		mount(<Check checked={false} onChange={onChange}>Acepto las condiciones</Check>);
		const text = Array.from(document.querySelectorAll("span")).find((s) => s.textContent === "Acepto las condiciones")!;
		act(() => text.click());
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it("es una casilla nativa con el texto como etiqueta", () => {
		mount(<Check checked onChange={() => {}}>Recordarme</Check>);
		const input = document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
		expect(input.checked).toBe(true);
		expect(input.labels?.[0]?.textContent).toBe("Recordarme");
	});

	it("deshabilitada no alterna", () => {
		const onChange = vi.fn();
		mount(<Check checked={false} disabled onChange={onChange}>x</Check>);
		act(() => document.querySelector("label")!.click());
		expect(onChange).not.toHaveBeenCalled();
		expect(document.querySelector<HTMLInputElement>("input")!.disabled).toBe(true);
	});

	it("respeta id y es sólida", () => {
		mount(<Check id="c1" checked onChange={() => {}}>x</Check>);
		expect(document.querySelector("input")!.id).toBe("c1");
		expect(document.querySelector(".vn-glass")).toBeNull();
	});
});

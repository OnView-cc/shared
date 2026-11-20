// @vitest-environment jsdom
/**
 * Desplegable de Ventana sobre Radix: nombre accesible, texto del disparador,
 * lista montada dentro de `.vn`, teclado, opciones apagadas y valor vacío.
 */
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installRadixDom } from "../tests/helpers/radix-dom";
import { Select, type Option } from "./select";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

beforeAll(() => installRadixDom());

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

const OPTIONS: Option[] = [
	{ value: "a", label: "Alfa", short: "A corta" },
	{ value: "b", label: "Beta", hint: "Pro" },
	{ value: "c", label: "Gamma", locked: true },
];

const key = (el: Element, k: string) =>
	act(() => {
		el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
	});

/** Radix enfoca y devuelve el foco en la cola de tareas: se deja correr. */
const flush = () =>
	act(async () => {
		await new Promise((r) => setTimeout(r, 50));
	});

const trigger = () => document.querySelector<HTMLButtonElement>("button[role=combobox]")!;

describe("Select de Ventana", () => {
	it("el disparador lleva aria-label y muestra short ?? label de la opción elegida", () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" />);
		expect(trigger().getAttribute("aria-label")).toBe("Voz");
		expect(trigger().textContent).toContain("A corta");
		act(() => root!.render(<Select value="b" onChange={() => {}} options={OPTIONS} label="Voz" />));
		expect(trigger().textContent).toContain("Beta");
	});

	it("sin elegida muestra el placeholder", () => {
		mount(<Select value="zzz" onChange={() => {}} options={OPTIONS} label="Voz" placeholder="Elegir" />);
		expect(trigger().textContent).toContain("Elegir");
	});

	it("abrir con Enter monta la lista dentro de un .vn con display: contents", () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" />);
		key(trigger(), "Enter");
		const list = document.querySelector(".vn [role=listbox]");
		expect(list).toBeTruthy();
		const wrap = list!.closest(".vn") as HTMLElement;
		expect(wrap.style.display).toBe("contents");
		expect(document.querySelectorAll("[role=option]").length).toBe(3);
	});

	it("el panel es vidrio grueso y el disparador sólido nunca lleva vn-glass", () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" />);
		expect(trigger().className).toContain("vn-select-trigger--field");
		expect(trigger().className).not.toContain("vn-glass");
		key(trigger(), "Enter");
		const panel = document.querySelector(".vn-select-panel")!;
		expect(panel.className).toContain("vn-glass");
		expect(panel.className).toContain("vn-glass--thick");
	});

	it("las filas nunca llevan vn-glass: el material es del panel", async () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" />);
		key(trigger(), "Enter");
		await flush();
		for (const o of document.querySelectorAll("[role=option]")) expect(o.className).not.toContain("vn-glass");
	});

	it("la variante chip no lleva vidrio", () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" variant="chip" />);
		expect(trigger().className).toContain("vn-select-trigger--chip");
		expect(trigger().className).not.toContain("vn-glass");
	});

	it("flecha abajo + Enter llama onChange con el valor siguiente", async () => {
		const onChange = vi.fn();
		mount(<Select value="a" onChange={onChange} options={OPTIONS} label="Voz" />);
		key(trigger(), "Enter");
		await flush();
		const active = () => document.activeElement as HTMLElement;
		expect(active().getAttribute("role")).toBe("option");
		key(active(), "ArrowDown");
		await flush();
		key(active(), "Enter");
		expect(onChange).toHaveBeenCalledWith("b");
	});

	it("una opción locked tiene aria-disabled y no se elige", async () => {
		const onChange = vi.fn();
		mount(<Select value="a" onChange={onChange} options={OPTIONS} label="Voz" />);
		key(trigger(), "Enter");
		await flush();
		const opts = [...document.querySelectorAll("[role=option]")];
		expect(opts[2].getAttribute("aria-disabled")).toBe("true");
		expect(opts[0].getAttribute("aria-disabled")).toBeNull();
		expect(opts[2].querySelector("svg")).toBeTruthy();
		expect(onChange).not.toHaveBeenCalled();
	});

	it("Escape cierra y el foco vuelve al disparador", async () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" />);
		key(trigger(), "Enter");
		await flush();
		expect(document.querySelector("[role=listbox]")).toBeTruthy();
		key(document.activeElement!, "Escape");
		await flush();
		expect(document.querySelector("[role=listbox]")).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});

	it("value vacío con una opción de valor vacío no rompe y se elige de vuelta a vacío", async () => {
		const onChange = vi.fn();
		const opts: Option[] = [
			{ value: "", label: "Ninguna" },
			{ value: "x", label: "Equis" },
		];
		function Harness() {
			const [v, setV] = useState("x");
			return (
				<Select
					value={v}
					onChange={(n) => {
						onChange(n);
						setV(n);
					}}
					options={opts}
					label="Kit"
				/>
			);
		}
		mount(<Harness />);
		key(trigger(), "Enter");
		await flush();
		const active = () => document.activeElement as HTMLElement;
		key(active(), "ArrowUp");
		await flush();
		key(active(), "Enter");
		expect(onChange).toHaveBeenCalledWith("");
		expect(trigger().textContent).toContain("Ninguna");
	});

	it("con value vacío elegido el disparador muestra la opción vacía", () => {
		mount(<Select value="" onChange={() => {}} options={[{ value: "", label: "Ninguna" }, { value: "x", label: "Equis" }]} label="Kit" />);
		expect(trigger().textContent).toContain("Ninguna");
	});

	it("disabled apaga el disparador; className, id y describedBy caen en él", () => {
		mount(<Select value="a" onChange={() => {}} options={OPTIONS} label="Voz" disabled id="voz" className="extra" describedBy="ayuda" />);
		expect(trigger().disabled).toBe(true);
		expect(trigger().id).toBe("voz");
		expect(trigger().className).toContain("extra");
		expect(trigger().getAttribute("aria-describedby")).toBe("ayuda");
	});
});

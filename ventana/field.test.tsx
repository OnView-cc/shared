// @vitest-environment jsdom
/**
 * Campos de Ventana: etiqueta enlazada, ayuda y error accesibles, cuenta de
 * caracteres y el alto de TextArea, que crece con el texto hasta `maxRows`.
 */
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextArea, TextField } from "./field";

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
});

/** Un campo controlado de verdad: React sólo ve el valor por el setter nativo. */
function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
	const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
	const set = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
	act(() => {
		set.call(el, value);
		el.dispatchEvent(new Event("input", { bubbles: true }));
	});
}

const ids = (el: Element) => (el.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);

describe("TextField", () => {
	it("la etiqueta apunta al campo", () => {
		const h = mount(<TextField id="nombre" label="Nombre" value="" onChange={() => {}} />);
		expect(h.querySelector("label")!.getAttribute("for")).toBe("nombre");
		expect(h.querySelector("input")!.id).toBe("nombre");
		expect(h.querySelector("input")!.className).toContain("vn-input");
	});

	it("con error: aria-invalid, describedby con el id del error y role alert", () => {
		const h = mount(<TextField id="mail" label="Correo" value="x" onChange={() => {}} error="Falta la arroba" />);
		const input = h.querySelector("input")!;
		expect(input.getAttribute("aria-invalid")).toBe("true");
		const alert = h.querySelector('[role="alert"]')!;
		expect(alert.textContent).toBe("Falta la arroba");
		expect(ids(input)).toContain(alert.id);
	});

	it("sin error no hay aria-invalid ni alerta", () => {
		const h = mount(<TextField id="mail" label="Correo" value="x" onChange={() => {}} />);
		expect(h.querySelector("input")!.hasAttribute("aria-invalid")).toBe(false);
		expect(h.querySelector('[role="alert"]')).toBeNull();
	});

	it("con ayuda: describedby incluye el id de la ayuda", () => {
		const h = mount(<TextField id="mail" label="Correo" value="" onChange={() => {}} hint="Usa el de trabajo" />);
		const input = h.querySelector("input")!;
		const hint = document.getElementById(ids(input)[0])!;
		expect(hint.textContent).toBe("Usa el de trabajo");
		expect(h.querySelector('[role="alert"]')).toBeNull();
	});

	it("sin ayuda ni error no apunta a nada", () => {
		const h = mount(<TextField id="mail" label="Correo" value="" onChange={() => {}} />);
		expect(h.querySelector("input")!.hasAttribute("aria-describedby")).toBe(false);
	});

	it("max pinta la cuenta n/max con vn-num cuando ya merece saberse", () => {
		const h = mount(<TextField id="t" label="Título" value={"a".repeat(18)} onChange={() => {}} max={20} />);
		const count = h.querySelector(".vn-field__count")!;
		expect(count.textContent).toBe("18/20");
		expect(count.classList.contains("vn-num")).toBe(true);
		expect(h.querySelector("input")!.maxLength).toBe(20);
	});

	it("la cuenta espera a los tres cuartos y no sale en techos menores de 20", () => {
		const corto = mount(<TextField id="t" label="Título" value="abc" onChange={() => {}} max={20} />);
		expect(corto.querySelector(".vn-field__count")).toBeNull();
		act(() => root!.render(<TextField id="t" label="Título" value="ab" onChange={() => {}} max={2} />));
		expect(corto.querySelector(".vn-field__count")).toBeNull();
	});

	it("cond pone cifras tabulares y escribir llama a onChange con el texto", () => {
		const onChange = vi.fn();
		const h = mount(<TextField id="c" label="Código" value="" onChange={onChange} cond />);
		const input = h.querySelector("input")!;
		expect(input.classList.contains("vn-num")).toBe(true);
		type(input, "AB-12");
		expect(onChange).toHaveBeenCalledWith("AB-12");
	});

	it("deja pasar los atributos del input", () => {
		const h = mount(<TextField id="p" label="Clave" value="" onChange={() => {}} type="password" autoComplete="off" />);
		const input = h.querySelector("input")!;
		expect(input.type).toBe("password");
		expect(input.autocomplete).toBe("off");
	});
});

describe("TextArea", () => {
	function Controlled({ maxRows }: { maxRows?: number }) {
		const [v, setV] = useState("");
		return <TextArea id="n" label="Notas" value={v} onChange={setV} maxRows={maxRows} style={{ lineHeight: "20px" }} />;
	}
	const spy = (el: HTMLTextAreaElement, box: { h: number }) =>
		Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => box.h });

	it("etiqueta enlazada, error accesible y ayuda", () => {
		const h = mount(<TextArea id="n" label="Notas" value="" onChange={() => {}} error="Obligatorio" hint="Ayuda" />);
		const area = h.querySelector("textarea")!;
		expect(h.querySelector("label")!.getAttribute("for")).toBe("n");
		expect(area.getAttribute("aria-invalid")).toBe("true");
		expect(ids(area)).toContain(h.querySelector('[role="alert"]')!.id);
		act(() => root!.render(<TextArea id="n" label="Notas" value="" onChange={() => {}} hint="Ayuda" />));
		expect(document.getElementById(ids(area)[0])!.textContent).toBe("Ayuda");
	});

	it("crece con el texto y no pasa de maxRows por el alto de línea", () => {
		const h = mount(<Controlled maxRows={5} />);
		const area = h.querySelector("textarea")!;
		const box = { h: 40 };
		spy(area, box);
		type(area, "uno");
		expect(area.style.height).toBe("40px");
		box.h = 80;
		type(area, "uno\ndos\ntres\ncuatro");
		expect(area.style.height).toBe("80px");
		box.h = 900;
		type(area, "x\n".repeat(40));
		expect(area.style.height).toBe("100px");
		expect(area.style.overflowY).toBe("auto");
		box.h = 60;
		type(area, "a\nb\nc");
		expect(area.style.height).toBe("60px");
		expect(area.style.overflowY).toBe("hidden");
	});

	it("maxRows vale 10 por defecto", () => {
		const h = mount(<Controlled />);
		const area = h.querySelector("textarea")!;
		spy(area, { h: 5000 });
		type(area, "x");
		expect(area.style.height).toBe("200px");
	});
});

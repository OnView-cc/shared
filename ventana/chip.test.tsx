// @vitest-environment jsdom
/**
 * Chip y StateChip de Ventana: span o botón según haya `onSelect`, aspa propia
 * que no dispara la selección, ni un botón dentro de otro, y los materiales
 * (sólido sin `vn-glass`, vidrio fino compuesto) de cada tono y estado.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chip, StateChip } from "./chip";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

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

describe("Chip", () => {
	it("sin onSelect no es un botón: es un span", () => {
		const el = mount(<Chip>Demostración</Chip>);
		expect(el.tagName).toBe("SPAN");
		expect(host!.querySelector("button")).toBeNull();
		expect(el.hasAttribute("aria-pressed")).toBe(false);
		expect(el.textContent).toBe("Demostración");
	});

	it("con onSelect es un botón con aria-pressed según selected, y al pulsarlo selecciona", () => {
		const onSelect = vi.fn();
		const el = mount(
			<Chip onSelect={onSelect} selected>
				9:16
			</Chip>,
		);
		expect(el.tagName).toBe("BUTTON");
		expect(el.getAttribute("type")).toBe("button");
		expect(el.getAttribute("aria-pressed")).toBe("true");
		act(() => el.click());
		expect(onSelect).toHaveBeenCalledOnce();
	});

	it("sin selected el botón se anuncia como no pulsado", () => {
		const el = mount(<Chip onSelect={() => {}}>9:16</Chip>);
		expect(el.getAttribute("aria-pressed")).toBe("false");
	});

	it("el ícono va delante, oculto a los lectores de pantalla", () => {
		const el = mount(<Chip icon={<svg data-testid="i" />}>Logo</Chip>);
		const icon = el.querySelector(".vn-chip__icon")!;
		expect(icon.getAttribute("aria-hidden")).toBe("true");
		expect(icon.nextElementSibling?.textContent).toBe("Logo");
	});

	it("el aspa es un botón con su nombre accesible; llama onRemove y no onSelect", () => {
		const onSelect = vi.fn();
		const onRemove = vi.fn();
		mount(
			<Chip onSelect={onSelect} onRemove={onRemove} removeLabel="Quitar logo">
				Logo
			</Chip>,
		);
		const x = host!.querySelector<HTMLButtonElement>('button[aria-label="Quitar logo"]')!;
		expect(x).not.toBeNull();
		act(() => x.click());
		expect(onRemove).toHaveBeenCalledOnce();
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("seleccionable y quitable: dos botones hermanos dentro de un span, ninguno anidado", () => {
		const onSelect = vi.fn();
		const el = mount(
			<Chip onSelect={onSelect} onRemove={() => {}} removeLabel="Quitar" selected>
				Logo
			</Chip>,
		);
		expect(el.tagName).toBe("SPAN");
		const buttons = [...el.querySelectorAll("button")];
		expect(buttons).toHaveLength(2);
		for (const b of buttons) expect(b.parentElement).toBe(el);
		expect(buttons.some((b) => b.querySelector("button"))).toBe(false);
		const select = buttons.find((b) => b.hasAttribute("aria-pressed"))!;
		expect(select.getAttribute("aria-pressed")).toBe("true");
		act(() => select.click());
		expect(onSelect).toHaveBeenCalledOnce();
	});

	it("quitable sin onSelect: span con el aspa dentro", () => {
		const el = mount(
			<Chip onRemove={() => {}} removeLabel="Quitar">
				Logo
			</Chip>,
		);
		expect(el.tagName).toBe("SPAN");
		expect(el.querySelectorAll("button")).toHaveLength(1);
	});

	it("className va en el elemento exterior", () => {
		expect(mount(<Chip className="extra">x</Chip>).classList.contains("extra")).toBe(true);
		expect(mount(<Chip className="extra" onSelect={() => {}}>x</Chip>).classList.contains("extra")).toBe(true);
		expect(mount(<Chip className="extra" onSelect={() => {}} onRemove={() => {}} removeLabel="q">x</Chip>).classList.contains("extra")).toBe(true);
	});

	it("el tono sólido (por defecto) nunca lleva vn-glass, ni siquiera seleccionado", () => {
		for (const node of [
			<Chip key="a">x</Chip>,
			<Chip key="b" selected onSelect={() => {}} onRemove={() => {}} removeLabel="q">x</Chip>,
		]) {
			const el = mount(node);
			expect(el.classList.contains("vn-chip--solid")).toBe(true);
			expect(host!.querySelector(".vn-glass")).toBeNull();
		}
	});

	it("el tono vidrio compone vn-glass vn-glass--thin y las piezas internas no llevan material", () => {
		const el = mount(
			<Chip tone="glass" onSelect={() => {}} onRemove={() => {}} removeLabel="q">
				Demostración
			</Chip>,
		);
		expect(el.classList.contains("vn-glass")).toBe(true);
		expect(el.classList.contains("vn-glass--thin")).toBe(true);
		expect(el.classList.contains("vn-chip--glass")).toBe(true);
		expect(el.classList.contains("vn-chip--solid")).toBe(false);
		expect(el.querySelectorAll(".vn-glass")).toHaveLength(0);
	});

	it("seleccionado queda marcado para el CSS", () => {
		expect(mount(<Chip selected>x</Chip>).classList.contains("is-selected")).toBe(true);
		expect(mount(<Chip>x</Chip>).classList.contains("is-selected")).toBe(false);
	});
});

describe("StateChip", () => {
	it("generando cuenta las tomas con cifras de ancho fijo", () => {
		const el = mount(<StateChip state="generating" done={2} total={5} label="Generando" />);
		expect(el.textContent).toBe("Generando 2/5");
		expect(el.classList.contains("vn-num")).toBe(true);
	});

	it("la cuenta sólo aparece al generar y con done y total", () => {
		expect(mount(<StateChip state="ready" done={2} total={5} label="Lista" />).textContent).toBe("Lista");
		expect(mount(<StateChip state="generating" label="Generando" />).textContent).toBe("Generando");
	});

	it.each([
		["draft", "vn-state--draft"],
		["generating", "vn-state--generating"],
		["ready", "vn-state--ready"],
		["failed", "vn-state--failed"],
	] as const)("%s lleva %s", (state, cls) => {
		const el = mount(<StateChip state={state} label="x" />);
		expect(el.tagName).toBe("SPAN");
		expect(el.classList.contains("vn-state")).toBe(true);
		expect(el.classList.contains(cls)).toBe(true);
	});

	it("sólo lista es vidrio fino compuesto; los otros tres nunca llevan vn-glass", () => {
		const ready = mount(<StateChip state="ready" label="x" />);
		expect(ready.classList.contains("vn-glass")).toBe(true);
		expect(ready.classList.contains("vn-glass--thin")).toBe(true);
		for (const state of ["draft", "generating", "failed"] as const) {
			expect(mount(<StateChip state={state} label="x" />).classList.contains("vn-glass")).toBe(false);
		}
	});

	it("className va en el mismo span", () => {
		expect(mount(<StateChip state="draft" label="x" className="extra" />).classList.contains("extra")).toBe(true);
	});
});

// @vitest-environment jsdom
/**
 * Botones de Ventana: etiqueta o enlace según haya `href`, deshabilitado,
 * nombre accesible del botón de ícono y la pulsación común.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Button, IconButton } from "./button";

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

describe("Button", () => {
	it("sin href es un button de type=button, primario y mediano", () => {
		const el = mount(<Button>Guardar</Button>);
		expect(el.tagName).toBe("BUTTON");
		expect(el.getAttribute("type")).toBe("button");
		expect(el.className).toBe("vn-btn vn-btn--primary vn-btn--md vn-press");
		expect(el.textContent).toBe("Guardar");
	});

	it("el type se puede pasar", () => {
		expect(mount(<Button type="submit">Enviar</Button>).getAttribute("type")).toBe("submit");
	});

	it("con href es un a con ese href", () => {
		const el = mount(<Button href="/app">Abrir</Button>);
		expect(el.tagName).toBe("A");
		expect(el.getAttribute("href")).toBe("/app");
		expect(el.classList.contains("vn-press")).toBe(true);
	});

	it("disabled llega al botón", () => {
		expect((mount(<Button disabled>No</Button>) as HTMLButtonElement).disabled).toBe(true);
	});

	it("un a deshabilitado no tiene href y lo dice con aria-disabled", () => {
		const el = mount(
			<Button href="/app" disabled>
				No
			</Button>,
		);
		expect(el.tagName).toBe("A");
		expect(el.hasAttribute("href")).toBe(false);
		expect(el.getAttribute("aria-disabled")).toBe("true");
	});

	it("un a deshabilitado no reacciona a clic ni a teclado", () => {
		let calls = 0;
		const el = mount(
			<Button href="/app" disabled onClick={() => calls++} onKeyDown={() => calls++}>
				No
			</Button>,
		);
		act(() => {
			el.click();
			el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		});
		expect(calls).toBe(0);
	});

	it("glass compone el vidrio fino y sm cambia el tamaño", () => {
		const el = mount(
			<Button variant="glass" size="sm" className="extra">
				Ver
			</Button>,
		);
		expect(el.classList.contains("vn-glass")).toBe(true);
		expect(el.classList.contains("vn-glass--thin")).toBe(true);
		expect(el.classList.contains("vn-btn--sm")).toBe(true);
		expect(el.classList.contains("extra")).toBe(true);
	});

	it.each(["primary", "plain", "danger"] as const)("%s no lleva vidrio", (variant) => {
		const el = mount(<Button variant={variant}>x</Button>);
		expect(el.classList.contains("vn-glass")).toBe(false);
		expect(el.classList.contains(`vn-btn--${variant}`)).toBe(true);
	});
});

describe("IconButton", () => {
	it("expone su label como nombre accesible y lleva el ícono", () => {
		const el = mount(
			<IconButton label="Cerrar">
				<svg />
			</IconButton>,
		);
		expect(el.tagName).toBe("BUTTON");
		expect(el.getAttribute("aria-label")).toBe("Cerrar");
		expect(el.querySelector("svg")).not.toBeNull();
		expect(el.classList.contains("vn-press")).toBe(true);
	});

	it("es de vidrio claro por defecto", () => {
		const el = mount(<IconButton label="Cerrar">x</IconButton>);
		expect(el.classList.contains("vn-glass--clear")).toBe(true);
		expect(el.classList.contains("vn-btn--icon")).toBe(true);
	});

	it("con href es un a; deshabilitado, sin href", () => {
		expect(
			mount(
				<IconButton label="Ir" href="/x">
					x
				</IconButton>,
			).tagName,
		).toBe("A");
		const el = mount(
			<IconButton label="Ir" href="/x" disabled>
				x
			</IconButton>,
		);
		expect(el.hasAttribute("href")).toBe(false);
		expect(el.getAttribute("aria-disabled")).toBe("true");
	});

	it("falla el tipo sin label", () => {
		// @ts-expect-error label es obligatorio: sin él el botón no tendría nombre
		const node = <IconButton>x</IconButton>;
		expect(node).toBeTruthy();
	});
});

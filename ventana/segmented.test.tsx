// @vitest-environment jsdom
/**
 * Segmentado de Ventana: radiogroup con tabindex móvil, flechas, Inicio y Fin,
 * pulgar de vidrio medido del botón elegido, sin animar al primer pintado y
 * quieto con movimiento reducido.
 */
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installRadixDom } from "../tests/helpers/radix-dom";
import { Segmented } from "./segmented";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
/** Falso mientras el segmentado está en algo que no se pinta (una hoja cerrada: `display: none`): todo mide 0. */
let laidOut = true;

beforeAll(() => {
	installRadixDom();
	// jsdom no calcula diseño: cada botón mide 100px y se coloca por su posición.
	const index = (el: HTMLElement) => Array.from(el.parentElement?.children ?? []).filter((c) => c.getAttribute("role") === "radio").indexOf(el);
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => (laidOut ? 100 : 0) });
	Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
		configurable: true,
		get(this: HTMLElement) {
			return laidOut && this.getAttribute("role") === "radio" ? index(this) * 100 : 0;
		},
	});
});

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

const OPTIONS = [
	{ value: "v", label: "Vertical" },
	{ value: "h", label: "Horizontal para YouTube" },
	{ value: "s", label: "Cuadrado" },
];

function Harness({ start = "v" }: { start?: string }) {
	const [value, setValue] = useState(start);
	return <Segmented value={value} options={OPTIONS} onChange={setValue} label="Formato" />;
}

const radios = () => Array.from(document.querySelectorAll<HTMLElement>('[role="radio"]'));
const key = (el: Element, k: string, mods: KeyboardEventInit = {}) => {
	const event = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...mods });
	act(() => {
		el.dispatchEvent(event);
	});
	return event;
};

describe("Segmented", () => {
	it("es un radiogroup con nombre y radios; sólo la elegida entra por tabulador", () => {
		setReducedMotion(false);
		mount(<Harness start="h" />);
		const group = document.querySelector('[role="radiogroup"]')!;
		expect(group.getAttribute("aria-label")).toBe("Formato");
		expect(radios().map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
		expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
	});

	it("flecha derecha e izquierda mueven la elección y el foco, sin salirse", () => {
		setReducedMotion(false);
		mount(<Harness />);
		key(radios()[0], "ArrowRight");
		expect(radios()[1].getAttribute("aria-checked")).toBe("true");
		expect(document.activeElement).toBe(radios()[1]);
		key(radios()[1], "ArrowRight");
		key(radios()[2], "ArrowRight");
		expect(radios()[2].getAttribute("aria-checked")).toBe("true");
		expect(document.activeElement).toBe(radios()[2]);
		key(radios()[2], "ArrowLeft");
		key(radios()[1], "ArrowLeft");
		key(radios()[0], "ArrowLeft");
		expect(radios()[0].getAttribute("aria-checked")).toBe("true");
		expect(document.activeElement).toBe(radios()[0]);
	});

	it("Inicio y Fin van a los extremos", () => {
		setReducedMotion(false);
		mount(<Harness start="h" />);
		key(radios()[1], "End");
		expect(radios()[2].getAttribute("aria-checked")).toBe("true");
		expect(document.activeElement).toBe(radios()[2]);
		key(radios()[2], "Home");
		expect(radios()[0].getAttribute("aria-checked")).toBe("true");
		expect(document.activeElement).toBe(radios()[0]);
	});

	it("en un extremo no avisa de una elección que no cambia", () => {
		setReducedMotion(false);
		const onChange = vi.fn();
		const view = (v: string) => <Segmented value={v} options={OPTIONS} onChange={onChange} label="Formato" />;
		mount(view("v"));
		key(radios()[0], "ArrowLeft");
		key(radios()[0], "Home");
		expect(onChange).not.toHaveBeenCalled();
		act(() => root!.render(view("s")));
		key(radios()[2], "ArrowRight");
		key(radios()[2], "End");
		expect(onChange).not.toHaveBeenCalled();
		key(radios()[2], "ArrowLeft");
		expect(onChange).toHaveBeenCalledWith("h");
	});

	it("las flechas con Alt, Ctrl o Meta no se tragan ni cambian nada", () => {
		setReducedMotion(false);
		const onChange = vi.fn();
		mount(<Segmented value="h" options={OPTIONS} onChange={onChange} label="Formato" />);
		for (const mod of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
			const event = key(radios()[1], "ArrowLeft", mod);
			expect(event.defaultPrevented).toBe(false);
		}
		expect(onChange).not.toHaveBeenCalled();
		expect(key(radios()[1], "ArrowLeft").defaultPrevented).toBe(true);
	});

	it("un clic elige la opción", () => {
		setReducedMotion(false);
		mount(<Harness />);
		act(() => radios()[2].click());
		expect(radios()[2].getAttribute("aria-checked")).toBe("true");
	});

	it("los botones no fijan ancho y la etiqueta larga se pinta entera", () => {
		setReducedMotion(false);
		mount(<Harness />);
		for (const r of radios()) expect(r.style.width).toBe("");
		expect(radios()[1].textContent).toBe("Horizontal para YouTube");
	});

	it("el pulgar es vidrio claro, oculto a lectores y se coloca bajo la opción elegida", () => {
		setReducedMotion(false);
		mount(<Harness start="h" />);
		const thumb = document.querySelector<HTMLElement>(".vn-seg-thumb")!;
		expect(thumb.getAttribute("aria-hidden")).toBe("true");
		expect(thumb.classList.contains("vn-glass")).toBe(true);
		expect(thumb.classList.contains("vn-glass--clear")).toBe(true);
		expect(thumb.textContent).toBe("");
		expect(thumb.style.getPropertyValue("--vn-seg-x")).toBe("100px");
		expect(thumb.style.getPropertyValue("--vn-seg-w")).toBe("100px");
		act(() => radios()[2].click());
		expect(thumb.style.getPropertyValue("--vn-seg-x")).toBe("200px");
	});

	it("el riel es sólido: sin vidrio en ninguna parte salvo el pulgar", () => {
		setReducedMotion(false);
		mount(<Harness />);
		const glass = Array.from(document.querySelectorAll(".vn-glass"));
		expect(glass).toEqual([document.querySelector(".vn-seg-thumb")]);
	});

	it("no anima al primer pintado: la transición se habilita después de medir", async () => {
		setReducedMotion(false);
		mount(<Harness />);
		const thumb = document.querySelector<HTMLElement>(".vn-seg-thumb")!;
		expect(thumb.hasAttribute("data-ready")).toBe(false);
		await act(async () => {
			await new Promise((r) => setTimeout(r, 60));
		});
		expect(thumb.hasAttribute("data-ready")).toBe(true);
	});

	/*
	 * Dentro de una `Sheet` el segmentado se monta (y se mide) antes de que el diálogo
	 * se abra: todo mide 0. Esa medida no cuenta; la primera de verdad llega con el
	 * `ResizeObserver` al abrirse, y el pulgar aparece ahí, sin deslizarse desde 0.
	 */
	it("dentro de algo que aún no se pinta (una hoja cerrada) no se coloca en 0: espera a la primera medida de verdad y no se desliza a ella", async () => {
		setReducedMotion(false);
		const callbacks: ResizeObserverCallback[] = [];
		const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
		(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
			constructor(cb: ResizeObserverCallback) {
				callbacks.push(cb);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		};
		laidOut = false;
		try {
			mount(<Harness start="h" />);
			const thumb = document.querySelector<HTMLElement>(".vn-seg-thumb")!;
			await act(async () => {
				await new Promise((r) => setTimeout(r, 60));
			});
			// Con todo a 0 el pulgar sigue oculto y sin transición: no hay nada desde donde deslizarse
			expect(thumb.hasAttribute("data-hidden")).toBe(true);
			expect(thumb.hasAttribute("data-ready")).toBe(false);
			// Se abre la hoja: el observador avisa con las medidas de verdad
			laidOut = true;
			act(() => callbacks.forEach((cb) => cb([], {} as ResizeObserver)));
			expect(thumb.hasAttribute("data-hidden")).toBe(false);
			expect(thumb.style.getPropertyValue("--vn-seg-x")).toBe("100px");
			// Llega a su sitio sin transición; ésta se habilita después
			expect(thumb.hasAttribute("data-ready")).toBe(false);
			await act(async () => {
				await new Promise((r) => setTimeout(r, 60));
			});
			expect(thumb.hasAttribute("data-ready")).toBe(true);
		} finally {
			laidOut = true;
			(globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
		}
	});

	it("con movimiento reducido el pulgar lleva data-still", () => {
		setReducedMotion(true);
		mount(<Harness />);
		expect(document.querySelector(".vn-seg-thumb")!.hasAttribute("data-still")).toBe(true);
	});

	it("sin movimiento reducido no lleva data-still", () => {
		setReducedMotion(false);
		mount(<Harness />);
		expect(document.querySelector(".vn-seg-thumb")!.hasAttribute("data-still")).toBe(false);
	});
});

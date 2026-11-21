// @vitest-environment jsdom
/**
 * Barra de navegación de Ventana: cápsula de vidrio fino con los enlaces en línea
 * desde 48rem y, por debajo, un botón de menú que abre una hoja de vidrio grueso
 * desde arriba (`<dialog>` nativo). Se simula `matchMedia` para estrecho y ancho
 * (como `sky/feed.test.tsx` con el movimiento reducido) y `showModal`/`close`
 * como `ventana/sheet.test.tsx`.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installRadixDom } from "../tests/helpers/radix-dom";
import { NavBar } from "./nav-bar";
import { Menu } from "./overlay";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

const showModal = vi.fn(function (this: HTMLDialogElement) {
	this.setAttribute("open", "");
});
const close = vi.fn(function (this: HTMLDialogElement) {
	this.removeAttribute("open");
	this.dispatchEvent(new Event("close"));
});

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = showModal;
	HTMLDialogElement.prototype.close = close;
});

/** `matchMedia` con oyentes: `setNarrow` cambia el ancho y avisa, como un cambio de ventana. */
let narrow = false;
const listeners = new Set<() => void>();
function stubViewport(isNarrow: boolean) {
	narrow = isNarrow;
	listeners.clear();
	window.matchMedia = ((query: string) => ({
		get matches() {
			return narrow && query.includes("max-width");
		},
		media: query,
		onchange: null,
		addEventListener: (_: string, fn: () => void) => listeners.add(fn),
		removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	})) as unknown as typeof window.matchMedia;
}
const resize = (isNarrow: boolean) =>
	act(() => {
		narrow = isNarrow;
		listeners.forEach((fn) => fn());
	});

function bar(props: Partial<React.ComponentProps<typeof NavBar>> = {}) {
	return (
		<NavBar label="Principal" brand={<span data-test="marca">OnView</span>} menuLabel="Abrir menú" closeLabel="Cerrar menú" end={<button data-test="entrar">Entrar</button>} {...props}>
			<a href="/precios" className="vn-nav-link" data-test="precios" aria-current="page">
				Precios
			</a>
			<a href="/ejemplos" className="vn-nav-link" data-test="ejemplos">
				Ejemplos
			</a>
		</NavBar>
	);
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
	showModal.mockClear();
	close.mockClear();
});

const menuButton = () => document.querySelector<HTMLButtonElement>('button[aria-label="Abrir menú"]');
const dialog = () => document.querySelector<HTMLDialogElement>("dialog");
const nav = () => document.querySelector("nav")!;
const count = (sel: string) => document.querySelectorAll(sel).length;
const escape = () => {
	const ev = new Event("cancel", { cancelable: true });
	act(() => {
		dialog()!.dispatchEvent(ev);
	});
	return ev;
};

describe("NavBar ancha", () => {
	it("es un header con un nav de vidrio fino, nombrado por label, con la marca, los enlaces y las acciones en orden", () => {
		stubViewport(false);
		mount(bar());
		const header = document.querySelector("header")!;
		expect(header.classList.contains("vn-nav")).toBe(true);
		expect(nav().parentElement).toBe(header);
		expect(nav().getAttribute("aria-label")).toBe("Principal");
		for (const c of ["vn", "vn-glass", "vn-glass--thin"]) expect(nav().classList.contains(c), c).toBe(true);
		const order = [...nav().querySelectorAll("[data-test]")].map((n) => n.getAttribute("data-test"));
		expect(order).toEqual(["marca", "precios", "ejemplos", "entrar"]);
	});

	it("no hay botón de menú ni hoja, y los hijos están una sola vez", () => {
		stubViewport(false);
		mount(bar());
		expect(menuButton()).toBeNull();
		expect(dialog()).toBeNull();
		expect(count("[data-test=precios]")).toBe(1);
	});

	it("compact pone data-compact y cambia a la capa gruesa sin tocar el vidrio fino a mano", () => {
		stubViewport(false);
		mount(bar({ compact: true }));
		expect(nav().hasAttribute("data-compact")).toBe(true);
		expect(nav().classList.contains("vn-glass--thick")).toBe(true);
		expect(nav().classList.contains("vn-glass--thin")).toBe(false);
	});

	it("los enlaces de la barra nunca llevan vn-glass: pintan su propio fondo oscuro (SOLID_PIECES)", () => {
		stubViewport(false);
		mount(bar());
		const links = nav().querySelectorAll(".vn-nav-link");
		expect(links.length).toBe(2);
		for (const l of links) expect(l.className).not.toMatch(/vn-glass/);
	});

	it("sin compact no hay data-compact", () => {
		stubViewport(false);
		mount(bar());
		expect(nav().hasAttribute("data-compact")).toBe(false);
	});
});

describe("NavBar estrecha", () => {
	it("enseña la marca y un botón de menú cerrado; los hijos aún no están", () => {
		stubViewport(true);
		mount(bar());
		const b = menuButton()!;
		expect(b).toBeTruthy();
		expect(b.getAttribute("aria-expanded")).toBe("false");
		expect(nav().querySelector("[data-test=marca]")).toBeTruthy();
		expect(nav().querySelector("[data-test=precios]")).toBeNull();
		expect(count("[data-test=precios]")).toBe(0);
	});

	it("al pulsar el botón se abre con showModal, aria-expanded pasa a true y los hijos y las acciones aparecen una sola vez, en la hoja", () => {
		stubViewport(true);
		mount(bar());
		const b = menuButton()!;
		act(() => b.click());
		expect(showModal).toHaveBeenCalledTimes(1);
		expect(b.getAttribute("aria-expanded")).toBe("true");
		const d = dialog()!;
		expect(b.getAttribute("aria-controls")).toBe(d.id);
		expect(d.id).not.toBe("");
		expect(d.querySelector("[data-test=precios]")).toBeTruthy();
		expect(d.querySelector("[data-test=entrar]")).toBeTruthy();
		expect(count("[data-test=precios]")).toBe(1);
		expect(count("[data-test=entrar]")).toBe(1);
		for (const c of ["vn", "vn-glass", "vn-glass--thick", "vn-nav-sheet", "vn-sheet-scrim"]) expect(d.classList.contains(c), c).toBe(true);
	});

	it("Escape (cancel) cierra, se previene el evento y el foco vuelve al botón", () => {
		stubViewport(true);
		mount(bar());
		const b = menuButton()!;
		b.focus();
		act(() => b.click());
		// El foco entra en la hoja, como hace showModal
		dialog()!.querySelector<HTMLElement>("a")!.focus();
		expect(document.activeElement).not.toBe(b);
		const ev = escape();
		expect(ev.defaultPrevented).toBe(true);
		expect(close).toHaveBeenCalledTimes(1);
		expect(b.getAttribute("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(b);
	});

	it("un clic en un enlace de la hoja la cierra y devuelve el foco al botón", () => {
		stubViewport(true);
		mount(bar());
		const b = menuButton()!;
		act(() => b.click());
		const link = dialog()!.querySelector<HTMLAnchorElement>("[data-test=ejemplos]")!;
		link.addEventListener("click", (e) => e.preventDefault());
		act(() => link.click());
		expect(close).toHaveBeenCalledTimes(1);
		expect(b.getAttribute("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(b);
	});

	it("con la hoja abierta los enlaces viven en su propio nav con el nombre de la barra y no llevan vn-glass", () => {
		stubViewport(true);
		mount(bar());
		act(() => menuButton()!.click());
		const inner = dialog()!.querySelector("nav")!;
		expect(inner.getAttribute("aria-label")).toBe("Principal");
		expect(inner.querySelector("[data-test=precios]")).toBeTruthy();
		for (const l of dialog()!.querySelectorAll(".vn-nav-link")) expect(l.className).not.toMatch(/vn-glass/);
	});

	it("un clic con modificador, con otro botón o en un enlace de pestaña nueva no la cierra", () => {
		stubViewport(true);
		mount(bar());
		act(() => menuButton()!.click());
		const link = dialog()!.querySelector<HTMLAnchorElement>("[data-test=ejemplos]")!;
		link.addEventListener("click", (e) => e.preventDefault());
		const click = (init: MouseEventInit) => act(() => void link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init })));
		for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) click(init);
		link.target = "_blank";
		click({});
		expect(close).not.toHaveBeenCalled();
		link.target = "";
		click({});
		expect(close).toHaveBeenCalledTimes(1);
	});

	it("un clic en algo que no es enlace (la acción) no la cierra", () => {
		stubViewport(true);
		mount(bar());
		act(() => menuButton()!.click());
		act(() => dialog()!.querySelector<HTMLElement>("[data-test=entrar]")!.click());
		expect(close).not.toHaveBeenCalled();
	});

	it("un clic en el fondo (el propio diálogo) la cierra", () => {
		stubViewport(true);
		mount(bar());
		act(() => menuButton()!.click());
		act(() => dialog()!.click());
		expect(close).toHaveBeenCalledTimes(1);
		expect(menuButton()!.getAttribute("aria-expanded")).toBe("false");
	});

	it("el aspa lleva closeLabel y cierra", () => {
		stubViewport(true);
		mount(bar());
		act(() => menuButton()!.click());
		const x = dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Cerrar menú"]')!;
		expect(x).toBeTruthy();
		act(() => x.click());
		expect(close).toHaveBeenCalledTimes(1);
	});

	it("si la ventana crece con la hoja abierta, se cierra y pasa a la barra ancha con los hijos una sola vez", () => {
		stubViewport(true);
		mount(bar());
		act(() => menuButton()!.click());
		expect(dialog()!.hasAttribute("open")).toBe(true);
		resize(false);
		expect(dialog()).toBeNull();
		expect(menuButton()).toBeNull();
		expect(nav().querySelector("[data-test=precios]")).toBeTruthy();
		expect(count("[data-test=precios]")).toBe(1);
		// El botón ya no existe: el foco no se pierde en body, va a la cápsula
		expect(document.activeElement).toBe(nav());
		// Y al volver a estrecharse no reaparece abierta
		resize(true);
		expect(menuButton()!.getAttribute("aria-expanded")).toBe("false");
		expect(dialog()!.hasAttribute("open")).toBe(false);
	});

	it("sale con el contenido montado hasta que acaba la salida y luego lo desmonta", () => {
		vi.useFakeTimers();
		try {
			stubViewport(true);
			mount(bar());
			act(() => menuButton()!.click());
			act(() => dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Cerrar menú"]')!.click());
			expect(count("[data-test=precios]")).toBe(1);
			act(() => void vi.advanceTimersByTime(500));
			expect(count("[data-test=precios]")).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("NavBar estrecha: paneles de Radix dentro de la hoja", () => {
	it("un menú abierto desde la hoja del menú monta su panel dentro del <dialog> (la hoja es modal y deja inerte lo de fuera)", async () => {
		installRadixDom();
		stubViewport(true);
		mount(bar({ end: <Menu trigger={<button data-test="cuenta">Cuenta</button>} label="Cuenta" items={[{ key: "salir", label: "Salir", onSelect: () => {} }]} /> }));
		// Un <button> nativo: el clic es su activación
		act(() => menuButton()!.click());
		act(() => {
			document.querySelector("[data-test=cuenta]")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
		});
		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});
		const panel = document.querySelector(".vn-menu");
		expect(panel).toBeTruthy();
		expect(dialog()!.contains(panel)).toBe(true);
	});
});

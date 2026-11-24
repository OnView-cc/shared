// @vitest-environment jsdom
/**
 * El armazón con barra lateral (spec 2026-11-24-onview-admin-correos-ventana
 * §4.1): en ancho, una barra de vidrio ahumado a la izquierda con la marca, las
 * secciones y la cuenta; en estrecho, la barra de arriba de Ventana (`NavBar`)
 * con las secciones en su hoja. Se simula `matchMedia` como en `dock.test.tsx`.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SideFrame, type SideNavItem } from "./side-frame";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

function stubViewport(isNarrow: boolean) {
	window.matchMedia = ((query: string) => ({
		matches: isNarrow && query.includes("max-width"),
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	})) as unknown as typeof window.matchMedia;
	// jsdom no trae el diálogo modal
	HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
		this.removeAttribute("open");
	};
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

const ITEMS: SideNavItem[] = [
	{ key: "overview", label: "Overview", href: "/", icon: <i data-icon="o" /> },
	{ key: "billing", label: "Billing", href: "/billing", icon: <i data-icon="b" />, current: true, count: 3, countLabel: "3 past due" },
	{ key: "people", label: "People", href: "/people", icon: <i data-icon="p" />, count: 0, countLabel: "0 past due" },
];

function frame() {
	return (
		<SideFrame brand={<span>OnView Admin</span>} label="Admin sections" items={ITEMS} account={<button type="button">Ana</button>} menuLabel="Menu" closeLabel="Close">
			<p>Contenido</p>
		</SideFrame>
	);
}

describe("SideFrame en ancho", () => {
	it("pinta una barra de vidrio con su nav, las secciones, la marca y la cuenta", () => {
		stubViewport(false);
		const h = mount(frame());
		const root = h.querySelector(".vn-side")!;
		expect(root.classList.contains("vn")).toBe(true);
		expect(root.classList.contains("vn-lit")).toBe(false);
		const aside = h.querySelector("aside")!;
		expect(aside.classList.contains("vn-glass")).toBe(true);
		expect(aside.querySelectorAll(".vn-glass").length).toBe(0);
		const nav = aside.querySelector("nav")!;
		expect(nav.getAttribute("aria-label")).toBe("Admin sections");
		const links = Array.from(nav.querySelectorAll("a")).map((a) => a.getAttribute("href"));
		expect(links).toEqual(["/", "/billing", "/people"]);
		expect(aside.textContent).toContain("OnView Admin");
		expect(aside.querySelector("button")?.textContent).toBe("Ana");
		expect(h.querySelector("main")?.textContent).toBe("Contenido");
	});

	it("marca la sección actual con aria-current", () => {
		stubViewport(false);
		const h = mount(frame());
		const current = h.querySelectorAll('nav a[aria-current="page"]');
		expect(current.length).toBe(1);
		expect(current[0].getAttribute("href")).toBe("/billing");
	});

	it("pinta la cifra sólo cuando es mayor que cero, con su texto accesible", () => {
		stubViewport(false);
		const h = mount(frame());
		const counts = h.querySelectorAll(".vn-side__count");
		expect(counts.length).toBe(1);
		expect(counts[0].textContent).toContain("3");
		expect(counts[0].querySelector(".vn-sr-only")?.textContent).toBe("3 past due");
	});
});

describe("SideFrame en estrecho", () => {
	it("no pinta la barra lateral; las secciones viven en la hoja del botón de menú", () => {
		stubViewport(true);
		const h = mount(frame());
		expect(h.querySelector("aside")).toBeNull();
		expect(document.querySelector('a[href="/billing"]')).toBeNull();
		const menu = Array.from(h.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Menu")!;
		act(() => menu.click());
		const link = document.querySelector<HTMLAnchorElement>('dialog a[href="/billing"]');
		expect(link).not.toBeNull();
		expect(link!.getAttribute("aria-current")).toBe("page");
		expect(document.querySelector("dialog")?.textContent).toContain("Ana");
	});

	it("elegir una sección cierra la hoja", () => {
		stubViewport(true);
		const h = mount(frame());
		const menu = Array.from(h.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Menu")!;
		act(() => menu.click());
		const link = document.querySelector<HTMLAnchorElement>('dialog a[href="/people"]')!;
		link.addEventListener("click", (e) => e.preventDefault());
		act(() => link.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })));
		expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(false);
	});
});

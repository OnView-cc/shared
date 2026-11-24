// @vitest-environment jsdom
/**
 * El dock de Ventana: la cápsula de vidrio ahumado de abajo. En ancho, los
 * destinos con su texto, la acción principal con su palabra y el saldo; en
 * estrecho, iconos con texto pequeño y la acción como botón redondo. Se simula
 * `matchMedia` como en `nav-bar.test.tsx`.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Dock, type DockItem } from "./dock";

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

const ITEMS: DockItem[] = [
	{ key: "videos", label: "Videos", href: "/app", icon: <i data-icon="videos" />, current: true },
	{ key: "kits", label: "Kits", href: "/app/brand", icon: <i data-icon="kits" /> },
];
const ACTION = { label: "Nuevo video", href: "/app/new" };

describe("Dock en ancho", () => {
	it("es un nav con su nombre, de vidrio, con los destinos, la acción y el saldo", () => {
		stubViewport(false);
		const h = mount(<Dock label="Navegación de la app" items={ITEMS} action={ACTION} meta={<a href="/app/billing">1,480 créditos</a>} />);
		const nav = h.querySelector("nav")!;
		expect(nav.getAttribute("aria-label")).toBe("Navegación de la app");
		expect(nav.classList.contains("vn-dock")).toBe(true);
		expect(nav.classList.contains("vn-glass")).toBe(true);
		const links = Array.from(nav.querySelectorAll("a")).map((a) => [a.textContent?.trim(), a.getAttribute("href")]);
		expect(links).toEqual([
			["Videos", "/app"],
			["Kits", "/app/brand"],
			["Nuevo video", "/app/new"],
			["1,480 créditos", "/app/billing"],
		]);
	});

	it("el destino actual lleva aria-current y los demás no", () => {
		stubViewport(false);
		const h = mount(<Dock label="Nav" items={ITEMS} action={ACTION} />);
		const [videos, kits] = Array.from(h.querySelectorAll(".vn-dock__item"));
		expect(videos.getAttribute("aria-current")).toBe("page");
		expect(kits.hasAttribute("aria-current")).toBe(false);
	});

	it("la acción es el botón primario y ningún hijo es otro vidrio", () => {
		stubViewport(false);
		const h = mount(<Dock label="Nav" items={ITEMS} action={ACTION} />);
		const action = h.querySelector("a[href='/app/new']")!;
		expect(action.classList.contains("vn-btn--primary")).toBe(true);
		expect(h.querySelectorAll(".vn-glass")).toHaveLength(1);
	});
});

describe("Dock en estrecho", () => {
	it("la acción es un botón redondo con su nombre y sin texto visible, y no hay saldo", () => {
		stubViewport(true);
		const h = mount(<Dock label="Nav" items={ITEMS} action={ACTION} meta={<span>1,480</span>} />);
		const action = h.querySelector("a[href='/app/new']")!;
		expect(action.getAttribute("aria-label")).toBe("Nuevo video");
		expect(action.textContent?.trim()).toBe("");
		expect(h.textContent).not.toContain("1,480");
		// La acción va en medio de los destinos
		const order = Array.from(h.querySelectorAll("nav a")).map((a) => a.getAttribute("href"));
		expect(order).toEqual(["/app", "/app/new", "/app/brand"]);
	});

	it("compact y hidden se marcan; escondido no se puede usar", () => {
		stubViewport(true);
		const h = mount(<Dock label="Nav" items={ITEMS} action={ACTION} compact hidden />);
		const nav = h.querySelector("nav")!;
		expect(nav.hasAttribute("data-compact")).toBe(true);
		expect(nav.hasAttribute("data-hidden")).toBe(true);
		expect(nav.hasAttribute("inert")).toBe(true);
	});

	it("sin compact ni hidden no hay marcas", () => {
		stubViewport(true);
		const h = mount(<Dock label="Nav" items={ITEMS} action={ACTION} />);
		const nav = h.querySelector("nav")!;
		expect(nav.hasAttribute("data-compact")).toBe(false);
		expect(nav.hasAttribute("inert")).toBe(false);
	});
});

describe("Dock con el enlace del enrutador", () => {
	it("pinta cada destino y la acción con linkAs, con sus clases y su estado", () => {
		stubViewport(false);
		const Fake = ({ href, className, children, ...rest }: { href: string; className?: string; children?: React.ReactNode; "aria-current"?: "page"; "aria-label"?: string }) => (
			<a href={href} className={className} data-router="" {...rest}>
				{children}
			</a>
		);
		const h = mount(<Dock label="Nav" items={ITEMS} action={ACTION} linkAs={Fake} />);
		const routed = Array.from(h.querySelectorAll("a[data-router]"));
		expect(routed.map((a) => a.getAttribute("href"))).toEqual(["/app", "/app/brand", "/app/new"]);
		expect(routed[0].getAttribute("aria-current")).toBe("page");
		expect(routed[2].classList.contains("vn-btn--primary")).toBe(true);
	});
});

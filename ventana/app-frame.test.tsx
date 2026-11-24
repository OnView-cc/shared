// @vitest-environment jsdom
/**
 * El armazón de la app en Ventana: la raíz `.vn` (ahumada, nunca luminosa), el
 * resplandor del kit detrás, arriba la marca y la cuenta (o la vuelta), el
 * contenido con el hueco del dock y el pie dentro del contenido.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { AppFrame } from "./app-frame";

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

describe("AppFrame", () => {
	it("la raíz es vn y vn-page, no luminosa, con el resplandor oculto detrás", () => {
		const h = mount(
			<AppFrame brand={<a href="/app">OnView</a>} account={<button type="button">MR</button>} glow={["#d6783c", "#2a968c"]}>
				<p>contenido</p>
			</AppFrame>,
		);
		const rootEl = h.firstElementChild!;
		expect(rootEl.classList.contains("vn")).toBe(true);
		expect(rootEl.classList.contains("vn-page")).toBe(true);
		expect(rootEl.classList.contains("vn-lit")).toBe(false);
		const glow = rootEl.querySelector(".vn-app__glow")!;
		expect(glow.getAttribute("aria-hidden")).toBe("true");
		expect(glow.querySelector(".vn-glow")).not.toBeNull();
	});

	it("arriba van la marca y la cuenta; el contenido va en main", () => {
		const h = mount(
			<AppFrame brand={<a href="/app">OnView</a>} account={<button type="button">MR</button>}>
				<p>contenido</p>
			</AppFrame>,
		);
		const top = h.querySelector(".vn-app__top")!;
		expect(top.querySelector("a")!.textContent).toBe("OnView");
		expect(top.querySelector("button")!.textContent).toBe("MR");
		expect(h.querySelector("main")!.textContent).toContain("contenido");
	});

	it("con dock, el main reserva su hueco y el dock va fuera del main", () => {
		const h = mount(
			<AppFrame brand="B" account="A" dock={<nav aria-label="Nav">dock</nav>} footer={<p>© OnView</p>}>
				<p>contenido</p>
			</AppFrame>,
		);
		const main = h.querySelector("main")!;
		expect(main.classList.contains("vn-app__main--dock")).toBe(true);
		expect(main.querySelector("nav")).toBeNull();
		expect(h.querySelector("nav")!.textContent).toBe("dock");
		// El pie va dentro del contenido, al final, antes del hueco
		expect(main.lastElementChild!.textContent).toBe("© OnView");
	});

	it("sin dock no hay reserva", () => {
		const h = mount(
			<AppFrame brand="B" account="A">
				<p>x</p>
			</AppFrame>,
		);
		expect(h.querySelector("main")!.classList.contains("vn-app__main--dock")).toBe(false);
	});

	it("con back, arriba va la vuelta en una cápsula de vidrio y el título en medio; no va la marca", () => {
		const h = mount(
			<AppFrame brand={<a href="/app">OnView</a>} account="A" back={{ label: "Videos", href: "/app", title: "Thermal mug launch" }}>
				<p>x</p>
			</AppFrame>,
		);
		const back = h.querySelector(".vn-app__back")!;
		expect(back.tagName).toBe("A");
		expect(back.getAttribute("href")).toBe("/app");
		expect(back.textContent).toContain("Videos");
		expect(back.classList.contains("vn-glass")).toBe(true);
		expect(h.querySelector(".vn-app__title")!.textContent).toBe("Thermal mug launch");
		expect(h.querySelector(".vn-app__top")!.textContent).not.toContain("OnView");
	});
});

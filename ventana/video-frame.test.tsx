// @vitest-environment jsdom
/**
 * VideoFrame de Ventana: el formato como clase (el aspect-ratio vive en el CSS y
 * lo comprueba tests/ventana-tokens.test.ts), rótulo con su propio scrim dentro del envoltorio, atenuado y
 * nombre accesible, con la misma firma que el de Feed vertical.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { VideoFrame } from "./video-frame";

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

describe("VideoFrame", () => {
	it.each([
		["9:16", "vn-frame--9x16"],
		["1:1", "vn-frame--1x1"],
		["16:9", "vn-frame--16x9"],
	] as const)("%s toma la forma de su formato", (format, cls) => {
		const el = mount(<VideoFrame format={format} />);
		expect(el.classList.contains("vn-frame")).toBe(true);
		expect(el.classList.contains(cls)).toBe(true);
	});

	it("sin rótulo no pinta ni envoltorio ni scrim", () => {
		mount(<VideoFrame format="9:16" />);
		expect(host!.querySelector(".vn-scrim")).toBeNull();
		expect(host!.querySelector(".vn-frame__caption")).toBeNull();
		expect(host!.querySelector(".vn-frame__text")).toBeNull();
	});

	it("con rótulo, el texto va dentro del envoltorio, visible a los lectores, y no hay un Scrim aparte", () => {
		const el = mount(<VideoFrame format="9:16" caption="Caliente doce horas." />);
		const wrap = el.querySelector(".vn-frame__caption")!;
		expect(wrap.querySelector(".vn-frame__text")?.textContent).toBe("Caliente doce horas.");
		expect(wrap.hasAttribute("aria-hidden")).toBe(false);
		expect(el.querySelector(".vn-scrim")).toBeNull();
		expect(el.querySelector("[aria-hidden=true]")).toBeNull();
	});

	it("un rótulo vacío ('') sigue contando como rótulo; null no", () => {
		mount(<VideoFrame format="1:1" caption="" />);
		expect(host!.querySelector(".vn-frame__caption")).not.toBeNull();
		mount(<VideoFrame format="1:1" caption={null} />);
		expect(host!.querySelector(".vn-frame__caption")).toBeNull();
	});

	it("los hijos van dentro del marco, antes del rótulo", () => {
		const el = mount(
			<VideoFrame format="16:9" caption="x">
				<img alt="" src="data:," />
			</VideoFrame>,
		);
		expect(el.firstElementChild?.tagName).toBe("IMG");
	});

	it("dim marca el marco como atenuado", () => {
		expect(mount(<VideoFrame format="1:1" dim />).classList.contains("is-dim")).toBe(true);
		expect(mount(<VideoFrame format="1:1" />).classList.contains("is-dim")).toBe(false);
	});

	it("className y style van en el marco; aria-label lo vuelve un grupo", () => {
		const el = mount(<VideoFrame format="9:16" className="extra" style={{ width: 120 }} aria-label="Toma 1" />);
		expect(el.classList.contains("extra")).toBe(true);
		expect(el.style.width).toBe("120px");
		expect(el.getAttribute("role")).toBe("group");
		expect(el.getAttribute("aria-label")).toBe("Toma 1");
	});

	it("sin aria-label no es un grupo", () => {
		expect(mount(<VideoFrame format="9:16" />).hasAttribute("role")).toBe(false);
	});

	it("el marco es sólido: nunca lleva vn-glass", () => {
		mount(<VideoFrame format="9:16" caption="x" />);
		expect(host!.querySelector(".vn-glass")).toBeNull();
	});
});

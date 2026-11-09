// @vitest-environment jsdom
/** La tira de contactos: fotogramas numerados en un borde de película; el lápiz graso marca el elegido. */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactStrip, type StripFrame } from "./contact-strip";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FRAMES: StripFrame[] = Array.from({ length: 6 }, (_, i) => ({ id: `f${i}`, caption: `Caption ${i + 1}` }));
let root: Root | null = null;
let host: HTMLDivElement;

function mount(node: React.ReactNode) {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = null;
});

describe("ContactStrip", () => {
	it("numbers the frames 01 to 06 in order, in the edge voice", () => {
		mount(<ContactStrip frames={FRAMES} label="Example promo" />);
		const numbers = [...host.querySelectorAll(".sk-frame-no")].map((n) => n.textContent);
		expect(numbers).toEqual(["01", "02", "03", "04", "05", "06"]);
		expect(host.querySelector(".sk-frame-no")?.classList.contains("sk-edge")).toBe(true);
	});

	it("marks the chosen frame as pressed and circles it in grease pencil", () => {
		mount(<ContactStrip frames={FRAMES} label="Example promo" chosen={2} onChoose={() => {}} />);
		const buttons = host.querySelectorAll("button");
		expect(buttons[2].getAttribute("aria-pressed")).toBe("true");
		expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
		expect(buttons[2].querySelector('[data-grease="circle"]')).not.toBeNull();
		expect(buttons[0].querySelector("[data-grease]")).toBeNull();
	});

	it("choosing a frame reports its index", () => {
		const onChoose = vi.fn();
		mount(<ContactStrip frames={FRAMES} label="Example promo" chosen={2} onChoose={onChoose} />);
		act(() => host.querySelectorAll("button")[4].click());
		expect(onChoose).toHaveBeenCalledWith(4);
	});

	it("without onChoose the frames are plain list items, not buttons", () => {
		mount(<ContactStrip frames={FRAMES} label="Example promo" />);
		expect(host.querySelectorAll("button")).toHaveLength(0);
		expect(host.querySelectorAll("li")).toHaveLength(6);
	});

	it("labels itself and shows the example label on its edge", () => {
		mount(<ContactStrip frames={FRAMES} label="Example promo" exampleLabel="Example" />);
		expect(host.querySelector("section")?.getAttribute("aria-label")).toBe("Example promo");
		expect(host.textContent).toContain("Example");
	});
});

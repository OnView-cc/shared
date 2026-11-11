// @vitest-environment jsdom
/**
 * Las piezas del mundo Feed vertical (spec §3.5 y §4): el marco de video en su
 * formato, la lámina sin imagen, la etiqueta de estado, las barras de avance,
 * el botón del riel con su costo, el paso de toma con las flechas y el símbolo
 * de Lumen que late mientras piensa.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sparkles } from "lucide-react";
import { RailButton, SheetFrame, StateTag, StoryBars, VideoFrame } from "./feed";
import { useStepKeys } from "./hooks";
import { AiMark } from "./kit";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement;

function mount(node: React.ReactNode) {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
}

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

afterEach(() => {
	act(() => root?.unmount());
	root = null;
	host?.remove();
});

describe("VideoFrame", () => {
	it("takes the shape of its format", () => {
		mount(<VideoFrame format="16:9" />);
		expect(host.querySelector(".sk-frame")?.classList.contains("sk-frame-16x9")).toBe(true);
	});

	it("puts the caption over the scrim, clamped", () => {
		mount(<VideoFrame format="9:16" caption="Caliente doce horas." />);
		expect(host.querySelector(".sk-scrim .sk-caption")?.textContent).toBe("Caliente doce horas.");
	});

	it("dims the image while a take is being made", () => {
		mount(<VideoFrame format="1:1" dim />);
		expect(host.querySelector(".sk-frame")?.classList.contains("is-dim")).toBe(true);
	});
});

describe("SheetFrame", () => {
	it("is a sheet with no image, painted with the colours it is given, and its title", () => {
		mount(<SheetFrame format="9:16" title="Lanzamiento" colors={["#5a2a1c", "#f0e2c8"]} />);
		const frame = host.querySelector(".sk-frame.sk-sheet-frame")!;
		expect(frame).not.toBeNull();
		expect(frame.querySelector("img")).toBeNull();
		expect(frame.querySelectorAll(".sk-sheet-stripes > i")).toHaveLength(2);
		expect(frame.textContent).toContain("Lanzamiento");
	});
});

describe("StateTag", () => {
	it.each([
		["draft", "sk-tag--line"],
		["generating", "sk-tag--solid"],
		["ready", "sk-tag--glass"],
		["failed", "sk-tag--alert"],
	] as const)("%s wears %s", (state, cls) => {
		mount(<StateTag state={state} label="x" />);
		expect(host.querySelector(".sk-tag")?.classList.contains(cls)).toBe(true);
	});

	it("a generating take counts its shots", () => {
		mount(<StateTag state="generating" done={2} total={5} label="Generando" />);
		expect(host.querySelector(".sk-tag")?.textContent).toBe("Generando 2/5");
	});

	it("the ready tag is glass over the video", () => {
		mount(<StateTag state="ready" label="Lista" />);
		expect(host.querySelector(".sk-tag")?.classList.contains("sk-over-video")).toBe(true);
	});
});

describe("StoryBars", () => {
	it("one bar per shot: the past full, the current one filling, decorative", () => {
		mount(<StoryBars count={4} current={1} progress={0.5} />);
		const bars = host.querySelectorAll(".sk-story > span");
		expect(bars).toHaveLength(4);
		expect(bars[0].classList.contains("is-done")).toBe(true);
		expect(bars[1].classList.contains("is-now")).toBe(true);
		expect((bars[1].firstElementChild as HTMLElement).style.transform).toBe("scaleX(0.5)");
		expect(host.querySelector(".sk-story")?.getAttribute("aria-hidden")).toBe("true");
	});
});

describe("RailButton", () => {
	it("says its cost to a screen reader and acts on press", () => {
		const onClick = vi.fn();
		mount(<RailButton icon={Sparkles} label="Regenerar" cost="60 créditos" onClick={onClick} />);
		const button = host.querySelector("button")!;
		expect(button.getAttribute("aria-label")).toBe("Regenerar, 60 créditos");
		expect(button.classList.contains("sk-over-video")).toBe(true);
		act(() => button.click());
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("marks the open section as pressed", () => {
		mount(<RailButton icon={Sparkles} label="Texto" active onClick={() => {}} />);
		expect(host.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
	});
});

function Stepper({ onIndex }: { onIndex: (i: number) => void }) {
	const onKeyDown = useStepKeys({ count: 3, index: 1, onIndex });
	return (
		<div tabIndex={0} onKeyDown={onKeyDown} data-testid="stage">
			<textarea />
		</div>
	);
}

describe("useStepKeys", () => {
	it("ArrowDown on the stage moves to the next shot", () => {
		const onIndex = vi.fn();
		mount(<Stepper onIndex={onIndex} />);
		const stage = host.querySelector<HTMLElement>("[data-testid=stage]")!;
		act(() => {
			stage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		});
		expect(onIndex).toHaveBeenCalledWith(2);
	});

	it("an arrow typed in a text field does not change the shot", () => {
		const onIndex = vi.fn();
		mount(<Stepper onIndex={onIndex} />);
		act(() => {
			host.querySelector("textarea")!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		});
		expect(onIndex).not.toHaveBeenCalled();
	});
});

describe("AiMark", () => {
	it("pulses while Lumen thinks", () => {
		setReducedMotion(false);
		mount(<AiMark thinking />);
		expect(host.querySelector("svg")?.classList.contains("sk-ai-thinking")).toBe(true);
	});

	it("stays still with reduced motion", () => {
		setReducedMotion(true);
		mount(<AiMark thinking />);
		expect(host.querySelector("svg")?.classList.contains("sk-ai-thinking")).toBe(false);
	});
});

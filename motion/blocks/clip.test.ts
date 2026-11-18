// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeShot } from "../../video/compose";
import { placeImages } from "../../video/scene-images";
import { parseBlockParams } from "../types";
import { createMotion } from "../index";

const brand = { textColor: "#ffee00", closingColor: "#0b1f44", accentColor: "#f1844d", colors: [], primary: { family: "inter", weight: 600 }, secondary: { family: "inter", weight: 500 }, sceneLogo: "corner.png", closingLogo: null };

function mount(o: Partial<ComposeShot>, mode: "export" | "preview" = "export") {
	const shot: ComposeShot = { id: "c1", position: 0, seconds: 4, block: "clip", params: parseBlockParams("clip", {}), beats: null, transition: "cut", trimIn: 1, trimOut: 3, clip: { src: "clip.mp4", seconds: 6 }, still: null, voice: null, images: [], ...o };
	const c = composeVideo({ format: "9:16", quality: "standard_1080p", voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine: "", tempo: { bpm: 120, offset: 0 }, template: null, shots: [shot], music: null, sfx: [], brand, limits: { maxResolution: "1080p", watermark: false } });
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null, framesOf: (id) => (n) => `frames/${id}/${n}.jpg` } }, { mode });
}
let root: HTMLElement;
afterEach(() => root?.remove());
const op = (el: Element | null | undefined) => Number((el as HTMLElement | null)?.style.opacity || "0");

describe("clip block", () => {
	it("export mode shows the frame for the current time and freezes on the last one", async () => {
		// Recorte de 1 a 3 s: 60 cuadros; el momento dura 4 golpes = 2 s.
		const m = mount({});
		const frame = () => root.querySelector<HTMLImageElement>("img.motion-clip")!.getAttribute("src");
		await m.seek(0);
		expect(frame()).toBe("frames/c1/0.jpg");
		await m.seek(1.0);
		expect(frame()).toBe("frames/c1/30.jpg");
		const longer = mount({ beats: 8 });
		await longer.seek(3.5);
		expect(frame()).toBe("frames/c1/59.jpg");
	});

	it("preview mode plays the clip in a video element", () => {
		mount({}, "preview");
		expect(root.querySelector("video.motion-clip")?.getAttribute("src")).toBe("clip.mp4");
	});

	it("the text shows only between textIn and textOut", async () => {
		const m = mount({ params: parseBlockParams("clip", { text: "Hola", textIn: 0.5, textOut: 1.5, textPosition: "top" }) });
		const text = root.querySelector<HTMLElement>(".motion-cliptext")!;
		expect(text.textContent).toBe("Hola");
		expect(text.style.color).toBe("rgb(255, 238, 0)");
		await m.seek(0.4);
		expect(op(text)).toBe(0);
		await m.seek(1.0);
		expect(op(text)).toBe(1);
		await m.seek(1.6);
		expect(op(text)).toBe(0);
	});

	it("scene images keep their layout", () => {
		const images = [{ id: "a", src: "a.png", width: 400, height: 400 }];
		mount({ images, params: parseBlockParams("clip", { imagesLayout: "center", imagesEntrance: "none" }) });
		const placed = placeImages({ layout: "center", entrance: "none", images, format: "9:16", seconds: 2, textPosition: null })[0]!;
		const img = root.querySelector<HTMLElement>("img.motion-sceneimg")!;
		expect(parseFloat(img.style.left)).toBeCloseTo(placed.x * 1080, 0);
		expect(parseFloat(img.style.width)).toBeCloseTo(placed.w * 1080, 0);
	});

	it("a clip moment carries the corner logo", () => {
		mount({});
		expect(root.querySelector(".motion-corner")?.getAttribute("src")).toBe("corner.png");
	});
});

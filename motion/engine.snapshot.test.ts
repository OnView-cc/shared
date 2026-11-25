// @vitest-environment jsdom
/**
 * La red de seguridad de las escenas (plan 2026-11-24, tarea 7): una composición
 * de tres bloques clásicos se dibuja exactamente igual que antes de que el motor
 * supiera de escenas. La instantánea se grabó con el motor de antes.
 */
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo } from "../video/compose";
import { createMotion } from "./index";
import { parseBlockParams } from "./types";

let root: HTMLElement | null = null;
afterEach(() => root?.remove());

describe("engine without scenes", () => {
	it("a composition without scene moments renders exactly as before", async () => {
		const c = composeVideo({
			format: "16:9", voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine: "Fin", tempo: { bpm: 120, offset: 0 }, template: { id: "software-launch", voice: false },
			shots: [
				{ id: "a", position: 0, seconds: 2, block: "text", params: parseBlockParams("text", { lines: ["Uno dos", "tres"] }), beats: 4, transition: "blur", voice: null, images: [] },
				{ id: "b", position: 1, seconds: 2, block: "product", params: parseBlockParams("product", { lines: ["Producto"] }), beats: 4, transition: "push", voice: null, images: [{ id: "i1", src: "p.png", width: 800, height: 600 }] },
				{ id: "c", position: 2, seconds: 2, block: "ui", params: parseBlockParams("ui", { zoom: { x: 0.4, y: 0.4, scale: 1.5 }, click: { x: 0.5, y: 0.5 } }), beats: 4, transition: "wipe", voice: null, images: [{ id: "i2", src: "s.png", width: 1600, height: 1000 }] },
			],
			music: null, sfx: [], brand: { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: ["#0b1f44", "#ffffff"], primary: { family: "inter", weight: 500 }, secondary: { family: "inter", weight: 400 }, sceneLogo: "logo.png", closingLogo: "closing.png" }, limits: { watermark: false },
		});
		root = document.createElement("div");
		document.body.appendChild(root);
		const m = createMotion(root, { ...c, media: { watermark: null } }, { mode: "export", imageWaitMs: 5 });
		const frames: string[] = [];
		for (const t of [0, 1, 2, 3.2, 5, 7]) {
			await m.seek(t);
			frames.push(root.innerHTML);
		}
		expect(frames).toMatchSnapshot();
	});
});

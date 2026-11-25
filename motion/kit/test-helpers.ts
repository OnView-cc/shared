/**
 * Lo que comparten las pruebas de la caja (sólo pruebas): un escenario en
 * jsdom con una capa, la línea de tiempo pausada y el `ctx` de una escena
 * armado como lo arma el motor, más la comprobación «mismo `seek`, mismo
 * cuadro» y «sin nodos nuevos por cuadro».
 */
import { gsap } from "gsap";
import { composeVideo } from "../../video/compose";
import type { MotionDoc } from "../doc";
import { createHandoffRegistry, sceneContext, type SceneCtx, type SceneEvent } from "../scene/context";
import { STYLES } from "../styles";
import { KIT_VERSION, parseBlockParams, type SceneParams } from "../types";

export const BRAND = { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: ["#0b1f44", "#3a6df0", "#ffffff"], primary: { family: "inter", weight: 600 }, secondary: { family: "inter", weight: 400 }, sceneLogo: "logo.png", closingLogo: "closing.svg", lightLogo: "light.svg" };

export function sceneHarness(opts: { at?: number; seconds?: number; format?: "16:9" | "9:16"; texts?: Record<string, string>; images?: { id: string; src: string; width: number; height: number }[] } = {}): { ctx: SceneCtx; events: () => SceneEvent[]; tl: gsap.core.Timeline; stage: HTMLElement; cleanup: () => void } {
	const at = opts.at ?? 0;
	const seconds = opts.seconds ?? 4;
	const c = composeVideo({ format: opts.format ?? "16:9", voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine: "", tempo: { bpm: 120, offset: 0 }, template: null, shots: [], music: null, sfx: [], brand: BRAND, limits: { watermark: false } });
	const doc: MotionDoc = { ...c, media: { watermark: null } };
	const stage = document.createElement("div");
	stage.className = "motion-stage";
	Object.assign(stage.style, { width: `${doc.width}px`, height: `${doc.height}px`, position: "relative" });
	const el = document.createElement("div");
	el.className = "motion-layer";
	stage.appendChild(el);
	document.body.appendChild(stage);
	const tl = gsap.timeline({ paused: true });
	const params: SceneParams = { code: "x", texts: opts.texts ?? {}, kitVersion: KIT_VERSION, fallback: { block: "text", params: parseBlockParams("text", {}) } };
	const u = Math.min(doc.width, doc.height) / 100;
	const { ctx, events } = sceneContext(
		{
			el,
			tl,
			moment: { shotId: "s", block: "scene", params, at, seconds, transition: "cut", images: opts.images ?? [] },
			doc,
			u,
			orientation: doc.width > doc.height ? "landscape" : doc.width < doc.height ? "portrait" : "square",
			mode: "export",
			beat: (n) => at + n * 0.5,
			beatSeconds: 0.5,
			cues: () => null,
			ink: "#ffffff",
			style: STYLES.arcade,
			background: { kind: "brand", color: "#0b1f44" },
			font: (f) => `"${f}", sans-serif`,
			onReady: () => {},
		},
		params,
		createHandoffRegistry(),
	);
	return { ctx, events, tl, stage, cleanup: () => stage.remove() };
}

/** El cuadro en `t`, como texto: el HTML del escenario (con sus estilos en línea). */
export function frameAt(tl: gsap.core.Timeline, stage: HTMLElement, t: number): string {
	tl.seek(t, false);
	return stage.innerHTML;
}

type Expect = (a: unknown) => { toBe(b: unknown): void; toEqual(b: unknown): void };

/** «Mismo `seek`, mismo cuadro» en varios tiempos, yendo y viniendo, y sin nodos nuevos por cuadro. */
export function expectDeterministic(tl: gsap.core.Timeline, stage: HTMLElement, times: number[], expect: Expect): void {
	const first = times.map((t) => frameAt(tl, stage, t));
	const nodes = stage.querySelectorAll("*").length;
	const span = Math.max(tl.duration(), 1);
	for (let i = 0; i < 30; i++) tl.seek((i * 0.37) % span, false);
	const again = [...times]
		.reverse()
		.map((t) => frameAt(tl, stage, t))
		.reverse();
	expect(again).toEqual(first);
	expect(stage.querySelectorAll("*").length).toBe(nodes);
}

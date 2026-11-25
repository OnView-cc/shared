/**
 * Los efectos de sonido que salen de las escenas (spec 2026-11-24-onview-escenas-con-codigo
 * §9.1): cada evento de una escena (un clic, una pieza que cae, un logo…) suena
 * con su efecto, en el segundo exacto. Se calculan en cada composición con los
 * eventos que guardó la última revisión de la escena, así que se mueven solos
 * cuando cambia el tempo, la voz o la escena. No se guardan como filas.
 *
 * Lo que la persona o Iris cambian se guarda como **excepción** en
 * `project_sfx` (`origin`): `mute` quita el efecto de un evento, `swap` le
 * cambia el sonido o el volumen. Un evento se nombra por `tipo#n` (su orden
 * dentro de su tipo en la escena); una excepción cuyo evento ya no existe se
 * ignora. Los efectos `manual` (añadidos a mano) los suma `composeVideo`, como
 * siempre.
 */
import type { SceneEventKind } from "../motion/scene/events";
import type { ComposeInput, Moment, SfxCue } from "./compose";
import type { SfxKey } from "./sfx-keys";

/** El sonido de cada evento, con variantes que se alternan por `n` para no repetir siempre el mismo. */
export const EVENT_SFX: Record<SceneEventKind, SfxKey[]> = {
	click: ["click-ui", "click-tap"],
	land: ["pop-soft", "pop-bubble", "hit-soft"],
	swipe: ["whoosh-swipe", "whoosh-fast"],
	whoosh: ["whoosh-soft", "whoosh-air"],
	type: ["click-tick"],
	reveal: ["pop-bright"],
	success: ["chime-success"],
	logo: ["hit-boom"],
};

export const EVENT_SFX_VOLUME = 0.6;
/** Dentro de un momento, dos efectos de eventos más juntos que esto: suena el primero. */
export const EVENT_SFX_GAP = 0.25;

export type SfxOverride = ComposeInput["sfx"][number];

export function sceneSfx(moments: Moment[], overrides: SfxOverride[]): SfxCue[] {
	const byRef = new Map<string, SfxOverride>();
	for (const o of overrides) if ((o.origin === "mute" || o.origin === "swap") && o.eventRef) byRef.set(`${o.shotId}:${o.eventRef}`, o);
	const cues: SfxCue[] = [];
	for (const m of moments) {
		if (m.block !== "scene" || !m.shotId || !m.events?.length) continue;
		let last = -Infinity;
		for (const e of [...m.events].sort((a, b) => a.at - b.at)) {
			const ref = `${e.kind}#${e.n}`;
			const id = `${m.shotId}:${ref}`;
			const o = byRef.get(id);
			if (o?.origin === "mute") continue;
			if (e.at - last < EVENT_SFX_GAP) continue;
			last = e.at;
			const variants = EVENT_SFX[e.kind];
			const key = o?.origin === "swap" ? o.sfxKey : variants[e.n % variants.length]!;
			cues.push({ id, shotId: m.shotId, sfxKey: key, at: Math.round((m.at + e.at) * 1000) / 1000, volume: o?.origin === "swap" ? o.volume : EVENT_SFX_VOLUME });
		}
	}
	return cues;
}

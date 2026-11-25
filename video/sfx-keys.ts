/**
 * Las claves de la biblioteca de efectos de sonido (subproyecto 6 de onview;
 * movidas aquí en la spec 2026-11-24 para que la composición, onview y el
 * estudio usen la misma lista). Los archivos los sirve onview desde
 * `public/sfx/<clave>.wav`; `onview/functions/_lib/sfx.ts` reexporta esto.
 */
export type SfxCategory = "pop" | "whoosh" | "click" | "slide" | "chime" | "transition" | "hit" | "rise";

const KEYS = {
	pop: ["pop-soft", "pop-bright", "pop-bubble", "pop-click", "pop-snap"],
	whoosh: ["whoosh-soft", "whoosh-fast", "whoosh-deep", "whoosh-air", "whoosh-swipe"],
	click: ["click-tap", "click-ui", "click-tick", "click-wood"],
	slide: ["slide-up", "slide-down", "slide-in", "slide-out"],
	chime: ["chime-bell", "chime-sparkle", "chime-ding", "chime-success"],
	transition: ["transition-sweep", "transition-riser-short", "transition-reverse"],
	hit: ["hit-soft", "hit-boom", "hit-punch"],
	rise: ["rise-short", "rise-long"],
} as const satisfies Record<SfxCategory, readonly string[]>;

export type SfxKey = (typeof KEYS)[SfxCategory][number];

export const SFX_LIBRARY: readonly { key: SfxKey; category: SfxCategory; file: string }[] = (Object.entries(KEYS) as [SfxCategory, readonly SfxKey[]][]).flatMap(([category, keys]) =>
	keys.map((key) => ({ key, category, file: `/sfx/${key}.wav` })),
);

const KEY_SET = new Set<string>(SFX_LIBRARY.map((s) => s.key));
export const isSfxKey = (value: unknown): value is SfxKey => typeof value === "string" && KEY_SET.has(value);

/**
 * La caja de componentes de las escenas (spec 2026-11-24-onview-escenas-con-codigo
 * §6.3): lo que recibe una escena como `kit`. Cada componente vive en su
 * familia (`text.ts`, `light.ts`, `brand.ts`, `device.ts`, `cursor.ts`,
 * `three.ts`…) y lleva su ficha (`.doc`), que `docs.ts` junta para el modelo que
 * escribe escenas.
 */
import { LogoReveal, Morph } from "./brand";
import { Cursor } from "./cursor";
import { Device } from "./device";
import { Glow, GradientMesh } from "./light";
import { Counter, KineticText } from "./text";
import { Box3D, Card3D } from "./three";

export const kit = {
	KineticText,
	Counter,
	Glow,
	GradientMesh,
	LogoReveal,
	Morph,
	Device,
	Cursor,
	Box3D,
	Card3D,
};

export type Kit = typeof kit;
export type { ComponentDoc } from "./base";

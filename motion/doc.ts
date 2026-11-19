/**
 * Lo que el motor dibuja: la composición (`@onview/shared/video/compose`) más lo
 * que depende de dónde corre. En el editor los `src` son URL; en el Container
 * de exportación son nombres de archivo que sirve el propio Container.
 */
import type { Composition } from "../video/compose";

export interface MotionMedia {
	/** La marca de agua, si el plan la lleva. */
	watermark: string | null;
	/** La familia CSS de una letra del kit (`inter` → `"Inter Variable", sans-serif`); por defecto, la clave entre comillas. */
	font?: (family: string) => string;
}

export type MotionDoc = Composition & { media: MotionMedia };

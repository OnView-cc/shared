/**
 * Lo que el motor dibuja: la composición (`@onview/shared/video/compose`) más lo
 * que depende de dónde corre. En el editor los `src` son URL; en el Container
 * de exportación son nombres de archivo que sirve el propio Container, y
 * `framesOf` da la URL del cuadro N de un clip ya extraído a imágenes (así cada
 * `seek` muestra exactamente su cuadro).
 */
import type { Composition } from "../video/compose";

export interface MotionMedia {
	/** La marca de agua, si el plan la lleva. */
	watermark: string | null;
	/** Sólo en la exportación: la URL del cuadro `frame` (desde 0) del clip de un momento. */
	framesOf?: (shotId: string) => ((frame: number) => string) | null;
	/** La familia CSS de una letra del kit (`inter` → `"Inter Variable", sans-serif`); por defecto, la clave entre comillas. */
	font?: (family: string) => string;
}

export type MotionDoc = Composition & { media: MotionMedia };

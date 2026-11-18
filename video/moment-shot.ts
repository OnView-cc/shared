/**
 * De una fila de momento (lo que guarda la base, con `src` ya resueltos) a lo
 * que recibe `composeVideo`: una sola regla para el editor y para la
 * exportación, así los dos componen lo mismo (spec 2026-11-18 §6).
 *
 * - Un `clip` toma su texto, su posición, sus tiempos y la colocación de sus
 *   imágenes de sus campos de siempre (los que escriben el editor y Lumen), no de
 *   `blockParams`.
 * - Una frase (`text`) con imágenes (las tarjetas de antes) las coloca también
 *   por sus campos de siempre (los del panel de imágenes).
 * - Unos `icons` llevan sólo los nombres que la persona escribió: la descripción
 *   que el estudio hace de una imagen nunca sale en el video (el editor la enseña
 *   como sugerencia).
 * - Los demás bloques llevan sus `blockParams`, validados.
 */
import { parseBlockParams, type AnyBlockParams, type BlockKind, type IconsParams, type Transition } from "../motion/types";
import type { ComposeShot, TextPosition } from "./compose";
import type { ImagesEntrance, ImagesLayout } from "./scene-images";

export interface MomentRow {
	id: string;
	position: number;
	seconds: number;
	block: BlockKind;
	blockParams: unknown;
	beats: number | null;
	transition: Transition;
	onScreenText: string;
	textPosition: TextPosition;
	textIn: number;
	textOut: number | null;
	imagesLayout: ImagesLayout;
	imagesEntrance: ImagesEntrance;
	trimIn: number;
	trimOut: number | null;
	clip: { src: string; seconds: number } | null;
	still: string | null;
	voice: { src: string } | null;
	images: { id: string; src: string; width: number; height: number; description?: string | null }[];
}

export function toComposeShot(r: MomentRow): ComposeShot {
	let params: AnyBlockParams;
	if (r.block === "clip") {
		params = parseBlockParams("clip", { text: r.onScreenText, textPosition: r.textPosition, textIn: r.textIn, textOut: r.textOut, imagesLayout: r.imagesLayout, imagesEntrance: r.imagesEntrance });
	} else if (r.block === "icons") {
		params = parseBlockParams("icons", r.blockParams) as IconsParams;
	} else if (r.block === "text" && r.images.length > 0) {
		// Las imágenes de una frase (las tarjetas de antes) se colocan por sus campos, como en un clip.
		params = { ...parseBlockParams("text", r.blockParams), imagesLayout: r.imagesLayout, imagesEntrance: r.imagesEntrance };
	} else {
		params = parseBlockParams(r.block, r.blockParams);
	}
	return {
		id: r.id,
		position: r.position,
		seconds: r.seconds,
		block: r.block,
		params,
		beats: r.beats,
		transition: r.transition,
		trimIn: r.trimIn,
		trimOut: r.trimOut,
		clip: r.clip,
		still: r.still,
		voice: r.voice,
		images: r.images.map(({ id, src, width, height }) => ({ id, src, width, height })),
	};
}

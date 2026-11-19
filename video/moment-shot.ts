/**
 * De una fila de momento (lo que guarda la base, con `src` ya resueltos) a lo
 * que recibe `composeVideo`: una sola regla para el editor y para la
 * exportación, así los dos componen lo mismo (spec 2026-11-18 §6).
 *
 * - Una frase (`text`) con imágenes (las tarjetas de antes) las coloca también
 *   por sus campos de siempre (los del panel de imágenes).
 * - Unos `icons` llevan sólo los nombres que la persona escribió: la descripción
 *   que el estudio hace de una imagen nunca sale en el video (el editor la enseña
 *   como sugerencia).
 * - Los demás bloques llevan sus `blockParams`, validados.
 */
import { parseBlockParams, type AnyBlockParams, type BlockKind, type IconsParams, type Transition } from "../motion/types";
import type { ComposeShot } from "./compose";
import type { ImagesEntrance, ImagesLayout } from "./scene-images";

export interface MomentRow {
	id: string;
	position: number;
	seconds: number;
	block: BlockKind;
	blockParams: unknown;
	beats: number | null;
	transition: Transition;
	imagesLayout: ImagesLayout;
	imagesEntrance: ImagesEntrance;
	voice: { src: string } | null;
	images: { id: string; src: string; width: number; height: number; description?: string | null }[];
}

export function toComposeShot(r: MomentRow): ComposeShot {
	let params: AnyBlockParams;
	if (r.block === "icons") {
		params = parseBlockParams("icons", r.blockParams) as IconsParams;
	} else if (r.block === "text" && r.images.length > 0) {
		// Las imágenes de una frase (las tarjetas de antes) se colocan por sus campos (los del panel de imágenes).
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
		voice: r.voice,
		images: r.images.map(({ id, src, width, height }) => ({ id, src, width, height })),
	};
}

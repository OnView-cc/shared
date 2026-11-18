/**
 * Dónde y cuándo aparecen las imágenes de una escena (spec 2026-11-17,
 * imágenes de escena §5): una sola regla para el editor y para la exportación,
 * como el resto de `compose.ts`.
 *
 * `placeImages` recibe la disposición, la entrada, el tamaño de cada imagen, el
 * formato, lo que dura la escena y dónde va su texto, y devuelve, por cada
 * imagen que se ve, su rectángulo **ya ajustado a la proporción de la imagen**
 * (en fracciones del cuadro) y su momento (en segundos desde el inicio de la
 * escena), con el fundido y la subida de su entrada. Las cuentas se hacen con el
 * lado corto del cuadro = 1, como las fracciones de `compose.ts`.
 *
 * - **Rejilla:** todas a la vez en filas y columnas centradas (en 9:16, más filas
 *   que columnas); deja libre la franja del texto.
 * - **Una tras otra:** grande, la escena repartida en partes iguales.
 * - **Grande al centro** y **Esquina:** sólo la primera.
 *
 * Código puro: no sabe del navegador ni de ffmpeg.
 */
import { FALLBACK_CLOSING, LOGO_MARGIN, TEXT_BOTTOM, TEXT_SIDE, TEXT_SIZE, TEXT_TOP, type Format, type TextPosition } from "./compose";

export type Background = "video" | "card";
export type ImagesLayout = "grid" | "sequence" | "center" | "corner";
export type ImagesEntrance = "none" | "fade" | "stagger";

export const BACKGROUNDS: readonly Background[] = ["video", "card"];
export const IMAGES_LAYOUTS: readonly ImagesLayout[] = ["grid", "sequence", "center", "corner"];
export const IMAGES_ENTRANCES: readonly ImagesEntrance[] = ["none", "fade", "stagger"];

/** «Una a una»: cada imagen entra este tiempo después de la anterior, con un fundido de esta misma duración. */
export const IMAGE_STAGGER = 0.3;
/** «Fundido»: todas a la vez, en este tiempo. */
export const IMAGE_FADE = 0.4;
/** Lo que sube una imagen al entrar «una a una», como fracción del lado corto. */
export const IMAGE_RISE = 0.03;
/** El margen de la imagen de la esquina (el del logo de la esquina). */
export const CORNER_MARGIN = LOGO_MARGIN;
/** El lado mayor de la imagen de la esquina, como fracción del lado corto. */
export const CORNER_MAX = 0.28;
/** El hueco entre celdas de la rejilla y entre las imágenes y la franja del texto. */
export const IMAGE_GAP = 0.04;
/** Lo que ocupa una imagen dentro de su celda de la rejilla. */
export const CELL_FILL = 0.85;
/** Lo que ocupa la imagen grande («Una tras otra», «Grande al centro») dentro del área libre. */
export const BIG_FILL = 0.8;
/** El alto que se reserva para el texto de la escena: dos líneas. */
const TEXT_BAND = TEXT_SIZE * 2 * 1.15;

export interface PlacedImage {
	/** Qué imagen es, en el orden de la escena. */
	index: number;
	/** El rectángulo, en fracciones del ancho (x, w) y del alto (y, h) del cuadro. */
	x: number;
	y: number;
	w: number;
	h: number;
	/** Desde el inicio de la escena. */
	from: number;
	to: number;
	/** El fundido de entrada, en segundos (0 = sin fundido). */
	fade: number;
	/** Lo que sube al entrar, en fracción del lado corto. */
	rise: number;
}

export interface PlaceInput {
	layout: ImagesLayout;
	entrance: ImagesEntrance;
	images: { width: number; height: number }[];
	format: Format;
	seconds: number;
	/** Null cuando la escena no lleva texto. */
	textPosition: TextPosition | null;
}

interface Box {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * El color de una tarjeta: el suyo, o el de cierre del kit (el mismo fondo que el
 * cierre; el primero del kit es el del texto y lo taparía), o el de cierre de
 * OnView sin kit.
 */
export function cardFill(own: string | null, kitClosing: string | null | undefined): string {
	return own ?? kitClosing ?? FALLBACK_CLOSING;
}

/** El cuadro con el lado corto = 1. */
function frameOf(format: Format): { W: number; H: number } {
	if (format === "9:16") return { W: 1, H: 16 / 9 };
	if (format === "16:9") return { W: 16 / 9, H: 1 };
	return { W: 1, H: 1 };
}

/** Las franjas verticales libres para las imágenes: fuera de los márgenes y del texto. */
function freeBands(H: number, text: TextPosition | null): { top: number; bottom: number }[] {
	const top = TEXT_SIDE;
	const bottom = H - TEXT_SIDE;
	if (text === "top") return [{ top: TEXT_TOP + TEXT_BAND + IMAGE_GAP, bottom }];
	if (text === "bottom") return [{ top, bottom: H - TEXT_BOTTOM - TEXT_BAND - IMAGE_GAP }];
	if (text === "center") {
		const half = TEXT_BAND / 2 + IMAGE_GAP / 2;
		return [
			{ top, bottom: H / 2 - half },
			{ top: H / 2 + half, bottom },
		];
	}
	return [{ top, bottom }];
}

/** La imagen dentro de su caja, sin deformarla y centrada. */
function contain(image: { width: number; height: number }, box: Box, fill: number): Box {
	const scale = Math.min((box.width * fill) / image.width, (box.height * fill) / image.height);
	const width = image.width * scale;
	const height = image.height * scale;
	return { left: box.left + (box.width - width) / 2, top: box.top + (box.height - height) / 2, width, height };
}

/** Columnas y filas de la rejilla según cuántas imágenes y el formato. */
function gridShape(n: number, tall: boolean): { cols: number; rows: number } {
	if (n <= 1) return { cols: 1, rows: 1 };
	if (n === 2) return tall ? { cols: 1, rows: 2 } : { cols: 2, rows: 1 };
	if (n <= 4) return { cols: 2, rows: 2 };
	return tall ? { cols: 2, rows: 3 } : { cols: 3, rows: 2 };
}

/**
 * Las celdas de la rejilla, fila a fila. Las celdas toman la proporción de las
 * imágenes (no se estiran a lo ancho ni a lo alto del área libre), así que las
 * imágenes quedan juntas, y el bloque va centrado en su franja. Con el texto al
 * centro, las filas se reparten arriba y abajo de él.
 */
function gridCells(images: { width: number; height: number }[], W: number, format: Format, bands: { top: number; bottom: number }[]): Box[] {
	const n = images.length;
	const { cols, rows } = gridShape(n, format === "9:16");
	const split = bands.length === 2 ? [Math.ceil(rows / 2), rows - Math.ceil(rows / 2)] : [rows];
	const aspects = images.map((i) => i.width / i.height);
	const widest = Math.max(...aspects);
	const tallest = Math.min(...aspects);
	const areaWidth = W - 2 * TEXT_SIDE;
	// El alto de fila que cabe en cada franja, el ancho de columna que cabe en el área, y los dos acotados por la proporción.
	const rowRoom = Math.min(...split.map((count, i) => (count ? (bands[i]!.bottom - bands[i]!.top - (count - 1) * IMAGE_GAP) / count : Infinity)));
	const colRoom = (areaWidth - (cols - 1) * IMAGE_GAP) / cols;
	const cellWidth = Math.min(colRoom, rowRoom * widest);
	const rowHeight = Math.min(rowRoom, cellWidth / tallest);
	const blockWidth = cols * cellWidth + (cols - 1) * IMAGE_GAP;
	const left = TEXT_SIDE + (areaWidth - blockWidth) / 2;
	const rowTops: number[] = [];
	split.forEach((count, i) => {
		if (!count) return;
		const band = bands[i]!;
		const blockHeight = count * rowHeight + (count - 1) * IMAGE_GAP;
		const top = band.top + (band.bottom - band.top - blockHeight) / 2;
		for (let r = 0; r < count; r++) rowTops.push(top + r * (rowHeight + IMAGE_GAP));
	});
	const cells: Box[] = [];
	for (let i = 0; i < n; i++) {
		const row = Math.floor(i / cols);
		const inRow = Math.min(cols, n - row * cols);
		// Una fila incompleta va centrada.
		const offset = ((cols - inRow) * (cellWidth + IMAGE_GAP)) / 2;
		cells.push({ left: left + offset + (i % cols) * (cellWidth + IMAGE_GAP), top: rowTops[row]!, width: cellWidth, height: rowHeight });
	}
	return cells;
}

/** El área libre más alta, para la imagen grande. */
function bigArea(W: number, H: number, text: TextPosition | null): Box {
	const band = freeBands(H, text).reduce((a, b) => (b.bottom - b.top > a.bottom - a.top ? b : a));
	return { left: TEXT_SIDE, top: band.top, width: W - 2 * TEXT_SIDE, height: band.bottom - band.top };
}

export function placeImages(input: PlaceInput): PlacedImage[] {
	const { images, format, seconds, textPosition, layout, entrance } = input;
	if (images.length === 0) return [];
	const { W, H } = frameOf(format);

	let boxes: { index: number; box: Box; from: number; to: number }[];
	if (layout === "grid") {
		const cells = gridCells(images, W, format, freeBands(H, textPosition));
		boxes = images.map((image, index) => ({ index, box: contain(image, cells[index]!, CELL_FILL), from: 0, to: seconds }));
	} else if (layout === "sequence") {
		const area = bigArea(W, H, textPosition);
		const slice = seconds / images.length;
		boxes = images.map((image, index) => ({ index, box: contain(image, area, BIG_FILL), from: index * slice, to: index === images.length - 1 ? seconds : (index + 1) * slice }));
	} else if (layout === "center") {
		boxes = [{ index: 0, box: contain(images[0]!, bigArea(W, H, textPosition), BIG_FILL), from: 0, to: seconds }];
	} else {
		const first = contain(images[0]!, { left: 0, top: 0, width: CORNER_MAX, height: CORNER_MAX }, 1);
		// Con el texto abajo, la imagen de la esquina sube por encima de su franja.
		const floor = textPosition === "bottom" ? H - TEXT_BOTTOM - TEXT_BAND - IMAGE_GAP : H - CORNER_MARGIN;
		boxes = [{ index: 0, box: { ...first, left: W - CORNER_MARGIN - first.width, top: floor - first.height }, from: 0, to: seconds }];
	}

	return boxes.map(({ index, box, from, to }) => {
		const stagger = entrance === "stagger";
		const start = stagger && layout === "grid" ? index * IMAGE_STAGGER : from;
		const fade = entrance === "none" ? 0 : stagger ? IMAGE_STAGGER : IMAGE_FADE;
		return {
			index,
			x: box.left / W,
			y: box.top / H,
			w: box.width / W,
			h: box.height / H,
			from: Math.min(start, Math.max(from, to - fade)),
			to,
			fade,
			rise: stagger ? IMAGE_RISE : 0,
		};
	});
}

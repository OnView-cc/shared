/**
 * El video de referencia (spec 2026-11-19-onview-estilos-y-referencias §7): lo
 * que el estudio mide de él en el Container y guarda onview
 * (`reference_videos.analysis`). Lumen recibe sus cuadros y estas medidas para
 * elegir estructura y estilo y afinar el tempo, el fondo, la letra y los cortes;
 * nunca su contenido.
 */

/** Lo más que dura un video de referencia, en segundos. */
export const MAX_REFERENCE_SECONDS = 90;
/** Lo más que pesa al subirlo (el tope del cuerpo de una petición a Pages). */
export const MAX_REFERENCE_BYTES = 100 * 1024 * 1024;
/** Cuántos cuadros se sacan como mucho. */
export const MAX_REFERENCE_FRAMES = 12;
/** Cuánto se guarda el video y sus cuadros; después sólo quedan las medidas. */
export const REFERENCE_TTL_SECONDS = 30 * 24 * 3600;

export type ReferenceState = "analyzing" | "ready" | "failed";
/** Por qué no se pudo medir: más largo de 90 s, ilegible para ffmpeg, u otra cosa. */
export type ReferenceError = "too_long" | "unreadable" | "failed";

export interface ReferenceAnalysis {
	seconds: number;
	width: number;
	height: number;
	/** Los segundos de cada corte, en orden. */
	cuts: number[];
	/** Lo que dura de media cada plano. */
	shotSeconds: number;
	/** El tempo de su música; null sin audio o sin pulso claro. */
	bpm: number | null;
	brightness: "light" | "dark";
	/** Hasta 4 colores dominantes, `#rrggbb`. */
	colors: string[];
}

/** La línea que Lumen lee con los cuadros (en inglés: es para el modelo). */
export function referenceLine(a: ReferenceAnalysis): string {
	const tempo = a.bpm === null ? "no clear tempo" : `~${Math.round(a.bpm)} BPM`;
	return `[Reference video: ${Math.round(a.seconds)} s, ${a.width}x${a.height}, ${a.cuts.length} cuts (${a.shotSeconds.toFixed(1)} s each), ${tempo}, ${a.brightness}, colors ${a.colors.join(" ")}]`;
}

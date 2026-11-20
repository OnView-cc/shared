/**
 * El registro de bloques del motor: cada bloque (`blocks/*.ts`) se registra
 * aquí y el motor lo llama al construir cada momento. Separado del motor para
 * que los bloques no importen al motor ni el motor a los bloques.
 */
import type { Moment } from "../video/compose";
import type { BlockKind } from "./types";
import type { BackgroundKind, Style } from "./styles";
import type { MotionDoc } from "./doc";

export interface BlockCtx {
	/** La capa del momento: el bloque dibuja dentro. */
	el: HTMLElement;
	/** La línea de tiempo del video entero (pausada); los tiempos son absolutos. */
	tl: gsap.core.Timeline;
	moment: Moment;
	doc: MotionDoc;
	/** Píxeles por unidad: 1 % del lado corto del cuadro. */
	u: number;
	orientation: "landscape" | "portrait" | "square";
	mode: "preview" | "export";
	/** El segundo absoluto del golpe `n` contado desde el inicio del momento. */
	beat(n: number): number;
	/** Lo que dura un golpe. */
	beatSeconds: number;
	/**
	 * El segundo absoluto en que la narración dice cada uno de estos textos, en orden (lo no dicho, repartido en lo
	 * hablado); null si el momento no tiene narración con palabras: entonces, golpes.
	 */
	cues(texts: string[]): number[] | null;
	/** El color de las letras sobre el fondo del estilo. */
	ink: string;
	/** El estilo del video, ya resuelto (spec 2026-11-19-onview-estilos-y-referencias). */
	style: Style;
	/** El fondo que se dibujó: su tipo y su color de base. */
	background: { kind: Exclude<BackgroundKind, "auto">; color: string };
	/** La familia CSS de una letra del kit. */
	font(family: string): string;
	/** Lo que necesita las fuentes ya cargadas (medir y encoger un texto que no cabe): se llama una vez, antes de `ready`. */
	onReady(fn: () => void): void;
}

export type BlockBuilder = (ctx: BlockCtx) => void;

const blocks = new Map<BlockKind, BlockBuilder>();

export function registerBlock(kind: BlockKind, build: BlockBuilder): void {
	blocks.set(kind, build);
}

export function blockFor(kind: BlockKind): BlockBuilder | undefined {
	return blocks.get(kind);
}

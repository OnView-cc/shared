/**
 * El momento `scene` en el motor (spec 2026-11-24-onview-escenas-con-codigo
 * §6.1–§6.2): compila el código de la escena, le da su `ctx` y la caja, y la
 * monta en una **línea de tiempo hija** puesta en el segundo 0 del video (los
 * tiempos de la escena son absolutos).
 *
 * Si no se puede: el código no compila, lanza al montar, o el motor la pidió
 * en respaldo (`forceFallback`), la capa se vacía y se dibuja el bloque clásico
 * de respaldo, con sus parámetros. Lo que pasó queda en `issues` y el momento
 * en `failed`; nada de eso para el video.
 *
 * Una escena que programa algo después del final de su momento (`overrun`) se
 * apunta pero se deja: su capa la apaga la transición, como a cualquier bloque.
 */
import { gsap } from "gsap";
import { kit } from "../kit";
import { blockFor, registerBlock, type BlockCtx } from "../registry";
import type { SceneParams } from "../types";
import { compileScene } from "./compile";
import { sceneContext } from "./context";

/** Cuánto puede pasarse una escena del final de su momento sin que se apunte. */
const OVERRUN_SLACK = 0.05;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

function fallback(ctx: BlockCtx, params: SceneParams): void {
	ctx.el.replaceChildren();
	ctx.el.dataset.block = params.fallback.block;
	blockFor(params.fallback.block)?.({ ...ctx, moment: { ...ctx.moment, block: params.fallback.block, params: params.fallback.params } });
	ctx.scene?.fail();
}

registerBlock("scene", (ctx) => {
	const params = ctx.moment.params as SceneParams;
	const s = ctx.scene;
	if (!s) return fallback(ctx, params);
	if (s.forceFallback) return fallback(ctx, params);
	let fn;
	try {
		fn = compileScene(params.code);
	} catch (e) {
		s.report({ code: "compile", message: message(e) });
		return fallback(ctx, params);
	}
	const child = gsap.timeline();
	ctx.tl.add(child, 0);
	const { ctx: sctx, events } = sceneContext({ ...ctx, tl: child }, params, s.handoffs);
	try {
		fn(sctx, kit);
	} catch (e) {
		ctx.tl.remove(child);
		child.kill();
		s.report({ code: "mount", message: message(e) });
		return fallback(ctx, params);
	}
	const end = ctx.moment.at + ctx.moment.seconds;
	// Lo que se añade al montar y lo que añada `onReady` (con las letras cargadas): se mira las dos veces.
	const checkOverrun = () => {
		if (child.duration() > end + OVERRUN_SLACK) s.report({ code: "overrun", message: `the scene animates until ${child.duration().toFixed(2)} s; its moment ends at ${end.toFixed(2)} s` });
	};
	checkOverrun();
	s.end(child.duration());
	ctx.onReady(() => s.end(child.duration()));
	s.events(events());
});

/**
 * De código a función (spec 2026-11-24-onview-escenas-con-codigo §6.2): el
 * módulo de una escena (`export default function scene(ctx, kit) {…}`) se
 * convierte en una función que el motor llama al montar el momento. La
 * función por defecto se guarda y se devuelve al final, para que los `const`
 * de arriba o de abajo ya estén puestos cuando el motor la llame.
 *
 * Sólo se llama sobre código que ya pasó `checkSceneCode` (y en las páginas
 * aisladas: el `iframe` del editor y el Container). Usa `new Function`, que la
 * CSP de la vista previa permite sólo en su origen opaco.
 */

/** La firma de una escena: `ctx` y `kit` se precisan en `context.ts` y `kit/`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SceneFn = (ctx: any, kit: any) => void;

export class SceneCompileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SceneCompileError";
	}
}

export function compileScene(code: string): SceneFn {
	const body = code.replace(/export\s+default\s+/, "const __scene = ");
	let fn: unknown;
	try {
		fn = new Function(`"use strict";\n${body}\n;return __scene;`)();
	} catch (error) {
		throw new SceneCompileError(error instanceof Error ? error.message : String(error));
	}
	if (typeof fn !== "function") throw new SceneCompileError("the scene does not export a function");
	return fn as SceneFn;
}

/**
 * La documentación de la caja para el modelo que escribe escenas (spec
 * 2026-11-24 §6.3): las fichas de todos los componentes, en orden alfabético,
 * con la versión de la caja arriba. El texto no cambia mientras no cambie la
 * caja, así la caché del prompt lo reutiliza turno tras turno.
 */
import { KIT_VERSION } from "../types";
import type { ComponentDoc } from "./base";
import { kit } from "./index";

export function kitDocs(): string {
	const docs = Object.values(kit)
		.map((c) => (c as { doc: ComponentDoc }).doc)
		.sort((a, b) => a.name.localeCompare(b.name, "en"));
	const parts = docs.map((d) => `## ${d.name}\n${d.signature}\n${d.options}\nExample:\n${d.example}`);
	return [`OnView scene kit v${KIT_VERSION}`, "Every component takes ctx first. Times are absolute seconds (ctx.beat(n), ctx.cues(...)). Sizes and positions are in u (1 % of the short side of the frame); the frame measures ctx.width / ctx.u by ctx.height / ctx.u.", ...parts].join("\n\n");
}

/**
 * La revisión estática del código de una escena (spec 2026-11-24-onview-escenas-con-codigo
 * §8.1), sin modelo y sin navegador: se analiza el código como árbol de sintaxis
 * con `acorn` y se rechaza lo que podría salir a la red, leer la sesión, romper
 * el determinismo del motor o meter otro documento en la página. Lo que se
 * rechaza vuelve al modelo con su motivo y su posición (`línea:columna`), en
 * inglés, para que lo corrija.
 *
 * Es una barrera, no la única: el código corre además dentro del `iframe`
 * aislado del editor y del Container sin internet (§10).
 *
 * La forma del programa es fija: una sola `export default function (ctx, kit)`
 * y, alrededor, sólo `const` y funciones con nombre.
 */
import { parse, type Node } from "acorn";
import { MAX_SCENE_CODE } from "../types";

export type CheckResult = { ok: true } | { ok: false; reasons: string[] };

/**
 * Los nombres que no pueden aparecer como identificador (ni leerse ni
 * declararse). Es la lista de la spec más los atajos al objeto global que la
 * harían inútil (`window`, `globalThis`, `self`, `document`…).
 */
export const FORBIDDEN_NAMES: ReadonlySet<string> = new Set([
	"fetch",
	"XMLHttpRequest",
	"WebSocket",
	"EventSource",
	"eval",
	"Function",
	"setTimeout",
	"setInterval",
	"localStorage",
	"sessionStorage",
	"indexedDB",
	"navigator",
	"parent",
	"top",
	"opener",
	"open",
	"postMessage",
	"location",
	"Date",
	"requestAnimationFrame",
	"performance",
	"window",
	"globalThis",
	"self",
	"document",
	"Reflect",
	"Proxy",
	"importScripts",
	"Worker",
	"SharedWorker",
]);

/** Las propiedades que no se pueden leer de ningún objeto. */
const FORBIDDEN_PROPS: ReadonlySet<string> = new Set([
	"cookie",
	"localStorage",
	"sessionStorage",
	"indexedDB",
	"opener",
	"defaultView",
	"constructor",
	"__proto__",
	"location",
	"postMessage",
	"navigator",
	"fetch",
]);

const FORBIDDEN_TAGS = ["script", "iframe", "video", "audio", "object", "embed"];
const TAG_IN_STRING = new RegExp(`<\\s*(${FORBIDDEN_TAGS.join("|")})\\b`, "i");

type AnyNode = Node & Record<string, unknown>;

export function checkSceneCode(code: string): CheckResult {
	if (new TextEncoder().encode(code).length > MAX_SCENE_CODE) return { ok: false, reasons: [`code is longer than ${MAX_SCENE_CODE} bytes`] };
	let program: AnyNode;
	try {
		program = parse(code, { ecmaVersion: 2023, sourceType: "module", locations: true }) as unknown as AnyNode;
	} catch (error) {
		const e = error as { message?: string; loc?: { line: number; column: number } };
		return { ok: false, reasons: [`syntax error at ${e.loc ? `${e.loc.line}:${e.loc.column}` : "0:0"}: ${e.message ?? "unknown"}`] };
	}
	const reasons: string[] = [];
	const at = (n: AnyNode) => {
		const loc = n.loc as { start: { line: number; column: number } } | undefined;
		return loc ? `${loc.start.line}:${loc.start.column}` : "0:0";
	};

	// La forma del programa.
	let defaults = 0;
	for (const stmt of program.body as AnyNode[]) {
		if (stmt.type === "ExportDefaultDeclaration") {
			defaults++;
			const d = stmt.declaration as AnyNode;
			const isFn = d.type === "FunctionDeclaration" || d.type === "FunctionExpression";
			if (!isFn || (d.params as unknown[]).length !== 2) reasons.push(`the default export must be a function (ctx, kit) at ${at(stmt)}`);
		} else if (stmt.type === "VariableDeclaration") {
			if (stmt.kind !== "const") reasons.push(`only const is allowed at the top level at ${at(stmt)}`);
		} else if (stmt.type !== "FunctionDeclaration") {
			reasons.push(`top-level ${stmt.type} is not allowed at ${at(stmt)}`);
		}
	}
	if (defaults !== 1) reasons.push(`exactly one default export function is required (found ${defaults})`);

	// El árbol entero.
	const visit = (node: AnyNode, parent: AnyNode | null, key: string): void => {
		switch (node.type) {
			case "Identifier": {
				const name = node.name as string;
				const isKey = parent && ((parent.type === "MemberExpression" && key === "property" && !parent.computed) || ((parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") && key === "key" && !parent.computed));
				if (!isKey && FORBIDDEN_NAMES.has(name)) reasons.push(`forbidden identifier ${name} at ${at(node)}`);
				break;
			}
			case "MemberExpression": {
				const prop = node.property as AnyNode;
				const name = !node.computed && prop.type === "Identifier" ? (prop.name as string) : prop.type === "Literal" && typeof prop.value === "string" ? prop.value : null;
				if (name && FORBIDDEN_PROPS.has(name)) reasons.push(`forbidden property ${name} at ${at(node)}`);
				const obj = node.object as AnyNode;
				if (name === "random" && obj.type === "Identifier" && obj.name === "Math") reasons.push(`forbidden Math.random at ${at(node)} (use ctx.random(seed))`);
				break;
			}
			case "ImportExpression":
				reasons.push(`forbidden import() at ${at(node)}`);
				break;
			case "ImportDeclaration":
			case "ExportNamedDeclaration":
			case "ExportAllDeclaration":
				reasons.push(`forbidden ${node.type} at ${at(node)}`);
				break;
			case "Literal":
				if (typeof node.value === "string") checkString(node.value as string, node);
				break;
			case "TemplateElement":
				checkString(String((node.value as { cooked?: string; raw: string }).cooked ?? (node.value as { raw: string }).raw), node);
				break;
			case "CallExpression": {
				const callee = node.callee as AnyNode;
				const args = node.arguments as AnyNode[];
				const isCreate = callee.type === "MemberExpression" && !callee.computed && (callee.property as AnyNode).name === "createElement";
				if (isCreate && args[0]?.type === "Literal" && typeof args[0].value === "string" && FORBIDDEN_TAGS.includes((args[0].value as string).toLowerCase())) {
					reasons.push(`forbidden element <${(args[0].value as string).toLowerCase()}> at ${at(node)}`);
				}
				break;
			}
		}
		for (const [k, value] of Object.entries(node)) {
			if (k === "loc" || k === "start" || k === "end") continue;
			if (Array.isArray(value)) for (const child of value) if (child && typeof child === "object" && typeof (child as AnyNode).type === "string") visit(child as AnyNode, node, k);
			if (value && typeof value === "object" && !Array.isArray(value) && typeof (value as AnyNode).type === "string") visit(value as AnyNode, node, k);
		}
	};
	const checkString = (text: string, node: AnyNode) => {
		const m = TAG_IN_STRING.exec(text);
		if (m) reasons.push(`forbidden markup <${m[1]!.toLowerCase()}> in a string at ${at(node)}`);
	};
	visit(program, null, "");

	return reasons.length ? { ok: false, reasons: [...new Set(reasons)] } : { ok: true };
}

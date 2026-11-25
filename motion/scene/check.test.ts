import { describe, expect, it } from "vitest";
import { checkSceneCode, FORBIDDEN_NAMES } from "./check";

const wrap = (body: string) => `export default function scene(ctx, kit) {\n${body}\n}`;
const reasons = (code: string) => {
	const r = checkSceneCode(code);
	return r.ok ? [] : r.reasons;
};

describe("checkSceneCode", () => {
	it("lists the exact forbidden names of the spec", () => {
		expect([...FORBIDDEN_NAMES].sort()).toEqual(
			["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "eval", "Function", "setTimeout", "setInterval", "localStorage", "sessionStorage", "indexedDB", "navigator", "parent", "top", "opener", "open", "postMessage", "location", "Date", "requestAnimationFrame", "performance", "window", "globalThis", "self", "document", "Reflect", "Proxy", "importScripts", "Worker", "SharedWorker"].sort(),
		);
	});

	it.each([...FORBIDDEN_NAMES])("rejects %s", (name) => {
		const out = reasons(wrap(`const x = ${name};`));
		expect(out.join("\n")).toContain(name);
	});

	it("rejects Math.random", () => expect(reasons(wrap("const r = Math.random();")).join()).toContain("Math.random"));
	it("rejects document.cookie through any object", () => expect(reasons(wrap("ctx.el.ownerDocument.cookie = 'a';")).join()).toContain("cookie"));
	it("rejects window.open through a member", () => expect(reasons(wrap("ctx.el.ownerDocument.defaultView.open('x');")).join()).toContain("defaultView"));
	it("rejects import()", () => expect(reasons(wrap("import('x');")).length).toBeGreaterThan(0));
	it("rejects static import", () => expect(reasons(`import a from "x";\n${wrap("")}`).length).toBeGreaterThan(0));
	it("rejects new Function", () => expect(reasons(wrap("const f = new Function('a');")).join()).toContain("Function"));
	it("rejects constructor tricks", () => expect(reasons(wrap("const f = (()=>{}).constructor('return 1');")).join()).toContain("constructor"));
	it("rejects createElement script", () => expect(reasons(wrap("ctx.el.ownerDocument.createElement('script');")).join()).toContain("script"));
	it("rejects createElement video", () => expect(reasons(wrap("ctx.el.ownerDocument.createElement('VIDEO');")).join()).toContain("video"));
	it("rejects a string with <iframe", () => expect(reasons(wrap("ctx.el.innerHTML = '<IFRAME src=x>';")).join()).toContain("iframe"));
	it("rejects a template literal with <script", () => expect(reasons(wrap("ctx.el.innerHTML = `<script>${1}</script>`;")).join()).toContain("script"));
	it("rejects two default exports", () => expect(reasons(`${wrap("")}\nexport default function b(a, c) {}`).length).toBeGreaterThan(0));
	it("rejects top-level let", () => expect(reasons(`let a = 1;\n${wrap("")}`).length).toBeGreaterThan(0));
	it("rejects a top-level expression", () => expect(reasons(`ctx;\n${wrap("")}`).length).toBeGreaterThan(0));
	it("rejects a default export with the wrong arity", () => expect(reasons("export default function scene(ctx) {}").length).toBeGreaterThan(0));
	it("rejects a syntax error with its position", () => expect(reasons(wrap("const = ;")).join()).toMatch(/\d+:\d+/));
	it("rejects 40961 bytes without parsing", () => expect(reasons("a".repeat(40961)).join()).toContain("40960"));

	it("accepts a valid scene", () => {
		const code = `const BEATS = 2;
function half(n) { return n / 2; }
export default function scene(ctx, kit) {
	const rnd = ctx.random(3);
	const t = kit.KineticText(ctx, { text: ctx.text("headline"), accent: ctx.text("accent"), at: ctx.beat(0) });
	const el = ctx.el.ownerDocument.createElement("div");
	el.style.left = half(rnd() * 100) + "%";
	ctx.el.appendChild(el);
	ctx.tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: ctx.beatSeconds * BEATS }, ctx.beat(1));
}`;
		expect(checkSceneCode(code)).toEqual({ ok: true });
	});

	it("allows a local variable shadowing nothing and object keys named like forbidden names", () => {
		expect(checkSceneCode(wrap("const o = { top: 1, parent: 2, location: 3 }; o.top = o.parent;"))).toEqual({ ok: true });
	});
});

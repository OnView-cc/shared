import { describe, expect, it } from "vitest";
import { compileScene, SceneCompileError } from "./compile";

describe("compileScene", () => {
	it("compiles and returns a callable that receives ctx and kit", () => {
		const fn = compileScene(`const K = 2;\nexport default function scene(ctx, kit) { ctx.out = kit.x * K; }`);
		const ctx: { out?: number } = {};
		fn(ctx as never, { x: 21 } as never);
		expect(ctx.out).toBe(42);
	});

	it("works with an anonymous default function expression", () => {
		const fn = compileScene(`export default function (ctx, kit) { ctx.out = 1; }`);
		const ctx: { out?: number } = {};
		fn(ctx as never, {} as never);
		expect(ctx.out).toBe(1);
	});

	it("throws SceneCompileError on syntax error", () => {
		expect(() => compileScene("export default function scene(ctx, kit) { const = ; }")).toThrow(SceneCompileError);
	});
});

import { describe, expect, it } from "vitest";
import { kitDocs } from "./docs";
import { kit } from "./index";

describe("kit docs", () => {
	it("every kit component has a doc with its four fields", () => {
		for (const [key, component] of Object.entries(kit)) {
			const doc = (component as unknown as { doc?: Record<string, string> }).doc;
			expect(doc, key).toBeDefined();
			expect(doc!.name).toBe(key);
			for (const field of ["signature", "options", "example"]) expect(doc![field]!.length, `${key}.${field}`).toBeGreaterThan(10);
		}
	});

	it("kitDocs is stable and starts with the kit version", () => {
		const a = kitDocs();
		expect(kitDocs()).toBe(a);
		expect(a.startsWith("OnView scene kit v1")).toBe(true);
		for (const key of Object.keys(kit)) expect(a).toContain(`## ${key}`);
	});

	it("lists components in alphabetical order", () => {
		const names = [...kitDocs().matchAll(/^## (\w+)/gm)].map((m) => m[1]);
		expect(names).toEqual([...names].sort());
	});
});

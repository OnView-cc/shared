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

describe("KIT_DOCS, the docs without the DOM (for the Worker)", () => {
	it("is exactly kitDocs(); regenerate with UPDATE_KIT_DOCS=1 npx vitest run motion/kit/docs.test.ts", async () => {
		const text = kitDocs();
		if (process.env.UPDATE_KIT_DOCS) {
			const { writeFileSync } = await import("node:fs");
			const body = `/**\n * La documentación de la caja ya escrita (la genera \`motion/kit/docs.test.ts\` con UPDATE_KIT_DOCS=1):\n * el mismo texto que \`kitDocs()\`, sin importar los componentes, para el Worker que escribe escenas\n * (no tiene DOM). La prueba falla si se queda vieja.\n */\nexport const KIT_DOCS = ${JSON.stringify(text)};\n`;
			writeFileSync(new URL("./docs-text.ts", import.meta.url), body);
		}
		const { KIT_DOCS } = await import("./docs-text");
		expect(KIT_DOCS).toBe(text);
	});
});

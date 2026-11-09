/**
 * El carril de la tira de contactos (revisión de código final de Blue Hour):
 * se desplaza sólo en horizontal (un `overflow-x: auto` solo hace también
 * desplazable el eje vertical, y la rueda del ratón movía la tira antes que la
 * página) y deja sitio arriba y abajo al círculo del lápiz graso, que sale del
 * fotograma: el relleno crece con el ancho del fotograma.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles/sky.css", import.meta.url), "utf8");
const rail = css.match(/\n\.sk \.sk-strip-rail \{([\s\S]*?)\n\}/)?.[1] ?? "";

describe("the strip rail", () => {
	it("scrolls only sideways", () => {
		expect(rail).toMatch(/overflow-x:\s*auto;/);
		expect(rail).toMatch(/overflow-y:\s*hidden;/);
	});

	it("leaves room for the grease circle above and below, growing with the frame", () => {
		expect(rail).toMatch(/padding-top:\s*max\(18px,\s*calc\(var\(--sk-frame-w, 168px\) \* 0\.11 \+ 4px\)\);/);
		expect(rail).toMatch(/padding-bottom:\s*max\(6px,\s*calc\(var\(--sk-frame-w, 168px\) \* 0\.18 - 16px\)\);/);
	});
});

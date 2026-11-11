// @vitest-environment jsdom
/** El documento del mundo: mientras se ve una página de OnView, `<html>` y la barra del navegador llevan el casi negro del mundo Feed vertical, y al salir vuelven a lo que había. */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { GROUND, INSIDE_GROUND, useDayDocument } from "./day";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
	useDayDocument();
	return null;
}

describe("useDayDocument", () => {
	it("paints the near-black ground and restores the previous values on unmount", () => {
		const meta = document.createElement("meta");
		meta.name = "theme-color";
		meta.content = "#123456";
		document.head.append(meta);
		document.documentElement.style.backgroundColor = "rgb(1, 2, 3)";

		const host = document.createElement("div");
		const root = createRoot(host);
		act(() => root.render(<Probe />));
		expect(GROUND).toBe("#0a0a0b");
		expect(INSIDE_GROUND).toBe(GROUND);
		expect(meta.content).toBe("#0a0a0b");
		expect(document.documentElement.style.backgroundColor).toBe("rgb(10, 10, 11)");

		act(() => root.unmount());
		expect(meta.content).toBe("#123456");
		expect(document.documentElement.style.backgroundColor).toBe("rgb(1, 2, 3)");
	});
});

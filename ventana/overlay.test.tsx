// @vitest-environment jsdom
/**
 * Menú, popover y tooltip de Ventana sobre Radix: contenido dentro de `.vn`,
 * vidrio grueso en el panel (nunca en las filas), teclado, ítems apagados,
 * separador, nombre accesible y disparador sin envoltorio.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installRadixDom } from "../tests/helpers/radix-dom";
import { Menu, Popover, Tooltip, TooltipGroup, type MenuItem } from "./overlay";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

beforeAll(() => installRadixDom());

function mount(node: React.ReactElement): HTMLElement {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = host = undefined;
	document.body.innerHTML = "";
});

const key = (el: Element, k: string) =>
	act(() => {
		el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
	});

/** Radix enfoca y devuelve el foco en la cola de tareas: se deja correr. */
const flush = () =>
	act(async () => {
		await new Promise((r) => setTimeout(r, 50));
	});

const trigger = () => document.querySelector<HTMLButtonElement>("button[data-test=disparador]")!;

function items(onSelect: Record<string, () => void> = {}): (MenuItem | "separator")[] {
	return [
		{ key: "a", label: "Renombrar", hint: "F2", onSelect: onSelect.a ?? (() => {}) },
		{ key: "b", label: "Duplicar", icon: <svg data-test="ico" />, onSelect: onSelect.b ?? (() => {}) },
		"separator",
		{ key: "c", label: "Archivar", disabled: true, onSelect: onSelect.c ?? (() => {}) },
		{ key: "d", label: "Borrar", danger: true, onSelect: onSelect.d ?? (() => {}) },
	];
}

describe("Menu de Ventana", () => {
	it("abre con Enter y su contenido vive dentro de un .vn con display: contents", () => {
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} />);
		key(trigger(), "Enter");
		const menu = document.querySelector("[role=menu]")!;
		expect(menu).toBeTruthy();
		const wrap = menu.closest(".vn") as HTMLElement;
		expect(wrap.style.display).toBe("contents");
		expect(menu.getAttribute("aria-label")).toBe("Acciones");
		// Radix lo apuntaría al disparador y taparía `label`
		expect(menu.hasAttribute("aria-labelledby")).toBe(false);
	});

	it("el panel es vidrio grueso y las filas nunca llevan vn-glass", async () => {
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} />);
		key(trigger(), "Enter");
		await flush();
		const panel = document.querySelector("[role=menu]")!;
		expect(panel.className).toContain("vn-glass");
		expect(panel.className).toContain("vn-glass--thick");
		const rows = document.querySelectorAll("[role=menuitem]");
		expect(rows.length).toBe(4);
		for (const r of rows) expect(r.className).not.toContain("vn-glass");
	});

	it("el disparador es el elemento que se pasa, sin envoltorio", () => {
		const h = mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} />);
		expect(h.firstElementChild).toBe(trigger());
		expect(h.children.length).toBe(1);
		expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
	});

	it("flecha abajo y Enter eligen el segundo ítem, llaman su onSelect y cierran", async () => {
		const b = vi.fn();
		const a = vi.fn();
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items({ a, b })} />);
		key(trigger(), "Enter");
		await flush();
		const active = () => document.activeElement as HTMLElement;
		expect(active().getAttribute("role")).toBe("menuitem");
		key(active(), "ArrowDown");
		await flush();
		// jsdom no convierte Enter en clic: el ítem de Radix hace su propio click() al recibir Enter.
		key(active(), "Enter");
		await flush();
		expect(b).toHaveBeenCalledTimes(1);
		expect(a).not.toHaveBeenCalled();
		expect(document.querySelector("[role=menu]")).toBeNull();
	});

	it("un ítem disabled lleva aria-disabled y no se elige ni con clic", async () => {
		const c = vi.fn();
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items({ c })} />);
		key(trigger(), "Enter");
		await flush();
		const disabled = [...document.querySelectorAll<HTMLElement>("[role=menuitem]")].find((r) => r.textContent?.includes("Archivar"))!;
		expect(disabled.getAttribute("aria-disabled")).toBe("true");
		act(() => disabled.click());
		await flush();
		expect(c).not.toHaveBeenCalled();
		expect(document.querySelector("[role=menu]")).toBeTruthy();
	});

	it("Escape cierra y el foco vuelve al disparador", async () => {
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} />);
		key(trigger(), "Enter");
		await flush();
		expect(document.querySelector("[role=menu]")).toBeTruthy();
		key(document.activeElement!, "Escape");
		await flush();
		expect(document.querySelector("[role=menu]")).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});

	it('"separator" pinta un role="separator" y no cuenta como ítem', async () => {
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} />);
		key(trigger(), "Enter");
		await flush();
		expect(document.querySelectorAll("[role=separator]").length).toBe(1);
		expect(document.querySelectorAll("[role=menuitem]").length).toBe(4);
	});

	it("pinta icono y hint del ítem y marca el peligroso con su clase", async () => {
		mount(<Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} />);
		key(trigger(), "Enter");
		await flush();
		const rows = [...document.querySelectorAll<HTMLElement>("[role=menuitem]")];
		expect(rows[0].querySelector(".vn-menu-hint")?.textContent).toBe("F2");
		expect(rows[1].querySelector("[data-test=ico]")).toBeTruthy();
		expect(rows[3].className).toContain("vn-menu-item--danger");
		expect(rows[0].className).not.toContain("vn-menu-item--danger");
	});
});

describe("Popover de Ventana", () => {
	it("abre con clic, lleva aria-label y vive dentro de un .vn con vidrio grueso", async () => {
		mount(
			<Popover trigger={<button data-test="disparador">Ajustes</button>} label="Ajustes del video">
				<p>Contenido</p>
			</Popover>,
		);
		act(() => trigger().click());
		await flush();
		const dialog = document.querySelector("[role=dialog]")!;
		expect(dialog).toBeTruthy();
		expect(dialog.getAttribute("aria-label")).toBe("Ajustes del video");
		expect((dialog.closest(".vn") as HTMLElement).style.display).toBe("contents");
		expect(dialog.className).toContain("vn-glass--thick");
		expect(dialog.textContent).toContain("Contenido");
	});

	it("el disparador es el elemento pasado, sin envoltorio", () => {
		const h = mount(
			<Popover trigger={<button data-test="disparador">Ajustes</button>} label="Ajustes">
				<p>x</p>
			</Popover>,
		);
		expect(h.firstElementChild).toBe(trigger());
		expect(h.children.length).toBe(1);
	});

	it("Escape cierra y el foco vuelve al disparador", async () => {
		mount(
			<Popover trigger={<button data-test="disparador">Ajustes</button>} label="Ajustes">
				<button>Dentro</button>
			</Popover>,
		);
		act(() => trigger().click());
		await flush();
		expect(document.querySelector("[role=dialog]")).toBeTruthy();
		key(document.activeElement!, "Escape");
		await flush();
		expect(document.querySelector("[role=dialog]")).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});
});

describe("Tooltip de Ventana", () => {
	it("aparece al enfocar su hijo y su texto está dentro de .vn con vidrio grueso", async () => {
		mount(
			<Tooltip label="Copiar enlace">
				<button data-test="disparador">Copiar</button>
			</Tooltip>,
		);
		expect(document.querySelector("[role=tooltip]")).toBeNull();
		act(() => trigger().focus());
		await flush();
		const tip = document.querySelector(".vn-tooltip")!;
		expect(tip).toBeTruthy();
		expect(tip.textContent).toContain("Copiar enlace");
		expect((tip.closest(".vn") as HTMLElement).style.display).toBe("contents");
		expect(tip.className).toContain("vn-glass--thick");
		expect(document.querySelector("[role=tooltip]")).toBeTruthy();
		expect(trigger().getAttribute("aria-describedby")).toBeTruthy();
	});

	it("el hijo es el disparador, sin envoltorio", () => {
		const h = mount(
			<Tooltip label="Copiar enlace">
				<button data-test="disparador">Copiar</button>
			</Tooltip>,
		);
		expect(h.firstElementChild).toBe(trigger());
		expect(h.children.length).toBe(1);
	});

	it("Escape lo cierra", async () => {
		mount(
			<Tooltip label="Copiar enlace">
				<button data-test="disparador">Copiar</button>
			</Tooltip>,
		);
		act(() => trigger().focus());
		await flush();
		expect(document.querySelector(".vn-tooltip")).toBeTruthy();
		key(document.activeElement!, "Escape");
		await flush();
		expect(document.querySelector(".vn-tooltip")).toBeNull();
	});
});

describe("TooltipGroup de Ventana", () => {
	const hover = (el: Element) =>
		act(() => {
			// jsdom no trae PointerEvent: Radix sólo mira que el puntero no sea táctil.
			el.dispatchEvent(new MouseEvent("pointermove", { bubbles: true }));
		});
	const tips = () => document.querySelectorAll(".vn-tooltip").length;
	const buttons = () => document.querySelectorAll<HTMLButtonElement>("button[data-test=boton]");
	const bar = (grouped: boolean) => {
		const inner = (
			<>
				<Tooltip label="Uno">
					<button data-test="boton">1</button>
				</Tooltip>
				<Tooltip label="Dos">
					<button data-test="boton">2</button>
				</Tooltip>
			</>
		);
		return grouped ? <TooltipGroup>{inner}</TooltipGroup> : inner;
	};

	it("un Tooltip dentro de un grupo abre al enfocar con su texto dentro de .vn", async () => {
		mount(
			<TooltipGroup>
				<Tooltip label="Copiar enlace">
					<button data-test="disparador">Copiar</button>
				</Tooltip>
			</TooltipGroup>,
		);
		act(() => trigger().focus());
		await flush();
		const tip = document.querySelector(".vn-tooltip")!;
		expect(tip.textContent).toContain("Copiar enlace");
		expect(tip.closest(".vn")).toBeTruthy();
	});

	it("bajo un grupo, el segundo tooltip abre sin espera justo después de cerrar el primero", async () => {
		vi.useFakeTimers();
		try {
			mount(bar(true));
			hover(buttons()[0]);
			expect(tips()).toBe(0);
			await act(async () => {
				await vi.advanceTimersByTimeAsync(400);
			});
			expect(tips()).toBe(1);
			key(document.activeElement ?? buttons()[0], "Escape");
			await act(async () => {
				await vi.advanceTimersByTimeAsync(10);
			});
			expect(tips()).toBe(0);
			hover(buttons()[1]);
			expect(tips()).toBe(1);
			expect(document.querySelector(".vn-tooltip")!.textContent).toContain("Dos");
		} finally {
			vi.useRealTimers();
		}
	});

	it("sin grupo cada tooltip espera sus 400ms aunque venga de otro", async () => {
		vi.useFakeTimers();
		try {
			mount(bar(false));
			hover(buttons()[0]);
			await act(async () => {
				await vi.advanceTimersByTimeAsync(400);
			});
			expect(tips()).toBe(1);
			key(document.activeElement ?? buttons()[0], "Escape");
			await act(async () => {
				await vi.advanceTimersByTimeAsync(10);
			});
			expect(tips()).toBe(0);
			hover(buttons()[1]);
			expect(tips()).toBe(0);
			await act(async () => {
				await vi.advanceTimersByTimeAsync(400);
			});
			expect(tips()).toBe(1);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("Menu y Popover controlados", () => {
	it("Popover con open y onOpenChange: abre y cierra cuando lo dice quien lo monta", async () => {
		const onOpenChange = vi.fn();
		const node = (open: boolean) => (
			<Popover trigger={<button data-test="disparador">Detalles</button>} label="Detalles" open={open} onOpenChange={onOpenChange}>
				<p>Contenido</p>
			</Popover>
		);
		mount(node(false));
		// Un <button> nativo: el clic es su activación. Pide abrir, pero manda `open`
		act(() => trigger().click());
		await flush();
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(document.querySelector(".vn-popover")).toBeNull();
		act(() => root!.render(node(true)));
		await flush();
		expect(document.querySelector(".vn-popover")).toBeTruthy();
		act(() => root!.render(node(false)));
		await flush();
		expect(document.querySelector(".vn-popover")).toBeNull();
	});

	it("Menu con open y onOpenChange: abierto desde fuera, sin tocar el disparador, y avisa al cerrarse con Escape", async () => {
		const onOpenChange = vi.fn();
		const node = (open: boolean) => <Menu trigger={<button data-test="disparador">Más</button>} label="Acciones" items={items()} open={open} onOpenChange={onOpenChange} />;
		mount(node(true));
		await flush();
		expect(document.querySelector("[role=menu]")).toBeTruthy();
		key(document.activeElement!, "Escape");
		await flush();
		expect(onOpenChange).toHaveBeenCalledWith(false);
		// Sigue abierto hasta que quien lo monta cambie `open`
		expect(document.querySelector("[role=menu]")).toBeTruthy();
		act(() => root!.render(node(false)));
		await flush();
		expect(document.querySelector("[role=menu]")).toBeNull();
	});
});

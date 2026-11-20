// @vitest-environment jsdom
/**
 * Hoja y avisos de Ventana: `<dialog>` nativo (abrir, cerrar, nombre, Escape, clic
 * fuera, foco) y `Toaster` sobre sonner con las clases de vidrio del sistema.
 * jsdom no implementa `showModal` ni `close`: se simulan en el prototipo como hace
 * `onview/src/test/dom.ts` (que `close` dispare el evento `close`, como el real).
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { Sheet } from "./sheet";
import { Toaster } from "./toast";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

const showModal = vi.fn(function (this: HTMLDialogElement) {
	this.setAttribute("open", "");
});
const close = vi.fn(function (this: HTMLDialogElement) {
	this.removeAttribute("open");
	this.dispatchEvent(new Event("close"));
});

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = showModal;
	HTMLDialogElement.prototype.close = close;
});

function mount(node: React.ReactElement): HTMLElement {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	act(() => root!.render(node));
	return host;
}
const render = (node: React.ReactElement) => act(() => root!.render(node));

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = host = undefined;
	document.body.innerHTML = "";
	showModal.mockClear();
	close.mockClear();
});

const dialog = () => document.querySelector("dialog")!;

describe("Sheet de Ventana", () => {
	it("open llama a showModal y open=false llama a close", () => {
		mount(<Sheet open={false} onClose={() => {}} title="Borrar" closeLabel="Cerrar" />);
		expect(showModal).not.toHaveBeenCalled();
		render(<Sheet open onClose={() => {}} title="Borrar" closeLabel="Cerrar" />);
		expect(showModal).toHaveBeenCalledTimes(1);
		expect(dialog().hasAttribute("open")).toBe(true);
		render(<Sheet open={false} onClose={() => {}} title="Borrar" closeLabel="Cerrar" />);
		expect(close).toHaveBeenCalledTimes(1);
		expect(dialog().hasAttribute("open")).toBe(false);
	});

	it("el título y la descripción están enlazados por aria-labelledby y aria-describedby", () => {
		mount(<Sheet open onClose={() => {}} title="Borrar proyecto" description="No se puede deshacer" closeLabel="Cerrar" />);
		const d = dialog();
		expect(document.getElementById(d.getAttribute("aria-labelledby")!)?.textContent).toBe("Borrar proyecto");
		expect(document.getElementById(d.getAttribute("aria-describedby")!)?.textContent).toBe("No se puede deshacer");
	});

	it("sin descripción no hay aria-describedby", () => {
		mount(<Sheet open onClose={() => {}} title="Borrar" closeLabel="Cerrar" />);
		expect(dialog().hasAttribute("aria-describedby")).toBe(false);
	});

	it("el aspa tiene closeLabel como nombre y llama a onClose", () => {
		const onClose = vi.fn();
		mount(<Sheet open onClose={onClose} title="Borrar" closeLabel="Cerrar ventana" />);
		const x = document.querySelector<HTMLButtonElement>('button[aria-label="Cerrar ventana"]')!;
		expect(x).toBeTruthy();
		// Un <button> nativo: el clic es su activación (jsdom no convierte teclas en clics)
		act(() => x.click());
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("el <dialog> lleva vn y el vidrio grueso él mismo", () => {
		mount(<Sheet open onClose={() => {}} title="Borrar" closeLabel="Cerrar" />);
		const cls = dialog().classList;
		for (const c of ["vn", "vn-glass", "vn-glass--thick", "vn-sheet"]) expect(cls.contains(c), c).toBe(true);
	});

	it("Escape (cancel) cierra con dismissable y el evento se previene siempre", () => {
		const onClose = vi.fn();
		mount(<Sheet open onClose={onClose} title="Borrar" closeLabel="Cerrar" />);
		const ev = new Event("cancel", { cancelable: true });
		act(() => {
			dialog().dispatchEvent(ev);
		});
		expect(ev.defaultPrevented).toBe(true);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("un clic en el fondo cierra; un clic dentro no", () => {
		const onClose = vi.fn();
		mount(
			<Sheet open onClose={onClose} title="Borrar" closeLabel="Cerrar">
				<p data-test="dentro">Contenido</p>
			</Sheet>,
		);
		act(() => document.querySelector<HTMLElement>("[data-test=dentro]")!.click());
		expect(onClose).not.toHaveBeenCalled();
		act(() => dialog().click());
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("con dismissable={false} no hay aspa, ni Escape ni clic fuera cierran, pero cancel se previene", () => {
		const onClose = vi.fn();
		mount(<Sheet open dismissable={false} onClose={onClose} title="Secreto" closeLabel="Cerrar" />);
		expect(document.querySelector('button[aria-label="Cerrar"]')).toBeNull();
		const ev = new Event("cancel", { cancelable: true });
		act(() => {
			dialog().dispatchEvent(ev);
		});
		expect(ev.defaultPrevented).toBe(true);
		act(() => dialog().click());
		expect(onClose).not.toHaveBeenCalled();
	});

	it("el elemento con data-autofocus recibe el foco al abrir", () => {
		mount(
			<Sheet open onClose={() => {}} title="Borrar" closeLabel="Cerrar">
				<button data-autofocus>Cancelar</button>
				<button>Borrar</button>
			</Sheet>,
		);
		expect(document.activeElement?.textContent).toBe("Cancelar");
	});

	const withBody = (open: boolean) => (
		<Sheet open={open} onClose={() => {}} title="Borrar" closeLabel="Cerrar" footer={<span data-test="pie">pie</span>}>
			<span data-test="cuerpo">cuerpo</span>
		</Sheet>
	);
	const body = () => document.querySelector("[data-test=cuerpo]");
	const foot = () => document.querySelector("[data-test=pie]");
	const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
	const transitionEnd = (el: Element, propertyName: string) =>
		act(() => {
			const ev = new Event("transitionend", { bubbles: true });
			Object.defineProperty(ev, "propertyName", { value: propertyName });
			el.dispatchEvent(ev);
		});

	it("el contenido y el pie se montan con open y siguen montados hasta que acaba la salida", () => {
		vi.useFakeTimers();
		try {
			mount(withBody(false));
			expect(body()).toBeNull();
			expect(foot()).toBeNull();
			render(withBody(true));
			expect(body()).toBeTruthy();
			expect(foot()).toBeTruthy();
			render(withBody(false));
			// Recién cerrada: sigue todo, para que la hoja no se encoja mientras se desvanece
			expect(body()).toBeTruthy();
			expect(foot()).toBeTruthy();
			advance(300);
			expect(body()).toBeTruthy();
			advance(200);
			expect(body()).toBeNull();
			expect(foot()).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});

	it("la salida acaba con la transición de opacidad del propio diálogo, no con la de un hijo ni con otra propiedad", () => {
		vi.useFakeTimers();
		try {
			mount(withBody(true));
			render(withBody(false));
			transitionEnd(body()!, "opacity");
			expect(body()).toBeTruthy();
			transitionEnd(dialog(), "translate");
			expect(body()).toBeTruthy();
			transitionEnd(dialog(), "opacity");
			expect(body()).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});

	it("reabrir durante la salida conserva el contenido, el mismo nodo, y no lo desmonta después", () => {
		vi.useFakeTimers();
		try {
			mount(withBody(true));
			const first = body();
			render(withBody(false));
			advance(100);
			render(withBody(true));
			expect(body()).toBe(first);
			advance(1000);
			transitionEnd(dialog(), "opacity");
			expect(body()).toBe(first);
			expect(foot()).toBeTruthy();
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("Toaster de Ventana", () => {
	it("un aviso lleva vn, vn-toast y el vidrio grueso, con el tema oscuro", async () => {
		mount(<Toaster />);
		await act(async () => {
			toast("Guardado");
			await new Promise((r) => setTimeout(r, 20));
		});
		const el = document.querySelector<HTMLElement>("[data-sonner-toast]")!;
		expect(el).toBeTruthy();
		for (const c of ["vn", "vn-toast", "vn-glass", "vn-glass--thick"]) expect(el.classList.contains(c), c).toBe(true);
		// Sin la piel de sonner: es lo que deja pasar el material
		expect(el.getAttribute("data-styled")).toBe("false");
		expect(document.querySelector("[data-sonner-toaster]")?.getAttribute("data-sonner-theme")).toBe("dark");
		expect(el.querySelector("[data-title]")?.className).toContain("vn-toast__title");
	});

	it("la descripción y el icono de un aviso de error llevan las clases del sistema", async () => {
		mount(<Toaster />);
		await act(async () => {
			toast.error("Falló", { description: "Inténtalo otra vez" });
			await new Promise((r) => setTimeout(r, 20));
		});
		const el = document.querySelector<HTMLElement>("[data-sonner-toast][data-type=error]")!;
		expect(el.querySelector("[data-description]")?.className).toContain("vn-toast__desc");
		expect(el.querySelector("[data-icon]")?.className).toContain("vn-toast__icon");
		expect(el.querySelector("[data-icon] svg")).toBeTruthy();
	});

	it("un aviso de carga lleva el cargador dentro del cuadro del icono, con el icono girado por el CSS de Ventana", async () => {
		mount(<Toaster />);
		await act(async () => {
			toast.loading("Guardando");
			await new Promise((r) => setTimeout(r, 20));
		});
		const el = document.querySelector<HTMLElement>("[data-sonner-toast][data-type=loading]")!;
		const icon = el.querySelector("[data-icon]")!;
		// Sonner ancla su cargador al cuadro del icono; que éste sea relative lo prueba tests/ventana-tokens
		const loader = icon.querySelector(".sonner-loader")!;
		expect(loader).toBeTruthy();
		expect(loader.querySelector("svg")?.getAttribute("class")).toContain("vn-toast__spin");
		expect(icon.className).toContain("vn-toast__icon");
	});
});

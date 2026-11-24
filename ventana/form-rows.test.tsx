// @vitest-environment jsdom
/**
 * Las filas de formulario de Ventana: guardar, confirmar y copiar. Todo texto
 * visible llega por props; ninguna lleva vidrio.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmRow, CopyButton, SaveRow } from "./form-rows";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

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

const WORDS = { saving: "Guardando…", saved: "Guardado.", blocked: "Corrige el campo para guardar.", unsaved: "Cambios sin guardar.", clean: "Sin cambios." };

describe("SaveRow", () => {
	const status = (h: HTMLElement) => h.querySelector("[aria-live='polite']")!.textContent;
	const button = (h: HTMLElement) => h.querySelector("button[type='submit']") as HTMLButtonElement;

	it("sin cambios lo dice y el botón está cerrado", () => {
		const h = mount(<SaveRow dirty={false} pending={false} label="Guardar" words={WORDS} />);
		expect(status(h)).toBe("Sin cambios.");
		expect(button(h).disabled).toBe(true);
		expect(button(h).textContent).toBe("Guardar");
	});

	it("con cambios lo dice y abre el botón, primario", () => {
		const h = mount(<SaveRow dirty pending={false} label="Guardar" words={WORDS} />);
		expect(status(h)).toBe("Cambios sin guardar.");
		expect(button(h).disabled).toBe(false);
		expect(button(h).classList.contains("vn-btn--primary")).toBe(true);
	});

	it("con un campo que no pasaría, el botón sigue cerrado y el aviso lo dice", () => {
		const h = mount(<SaveRow dirty blocked pending={false} label="Guardar" words={WORDS} />);
		expect(status(h)).toBe("Corrige el campo para guardar.");
		expect(button(h).disabled).toBe(true);
	});

	it("guardando lo dice en el aviso y en el botón", () => {
		const h = mount(<SaveRow dirty pending label="Guardar" words={WORDS} />);
		expect(status(h)).toBe("Guardando…");
		expect(button(h).textContent).toBe("Guardando…");
		expect(button(h).getAttribute("aria-busy")).toBe("true");
	});

	it("guardado y sin cambios nuevos dice que se guardó", () => {
		const h = mount(<SaveRow dirty={false} saved pending={false} label="Guardar" words={WORDS} />);
		expect(status(h)).toBe("Guardado.");
	});

	it("no lleva vidrio", () => {
		const h = mount(<SaveRow dirty pending={false} label="Guardar" words={WORDS} extra={<button type="button">Deshacer</button>} />);
		expect(h.innerHTML).not.toContain("vn-glass");
		expect(h.textContent).toContain("Deshacer");
	});
});

describe("ConfirmRow", () => {
	it("llama a cancelar y a confirmar con sus palabras", () => {
		const onCancel = vi.fn();
		const onConfirm = vi.fn();
		const h = mount(<ConfirmRow error={null} pending={false} label="Borrar" pendingLabel="Borrando…" cancelLabel="Cancelar" onCancel={onCancel} onConfirm={onConfirm} danger />);
		const [cancel, confirm] = Array.from(h.querySelectorAll("button"));
		expect(cancel.textContent).toBe("Cancelar");
		expect(confirm.textContent).toBe("Borrar");
		expect(confirm.classList.contains("vn-btn--danger")).toBe(true);
		act(() => cancel.click());
		act(() => confirm.click());
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("cierra confirmar mientras falta algo y pinta el error", () => {
		const h = mount(<ConfirmRow error={new Error("No se pudo.")} pending={false} label="Borrar" pendingLabel="Borrando…" cancelLabel="Cancelar" onCancel={() => {}} onConfirm={() => {}} canConfirm={false} />);
		const confirm = h.querySelectorAll("button")[1] as HTMLButtonElement;
		expect(confirm.disabled).toBe(true);
		expect(h.querySelector("[role='alert']")!.textContent).toContain("No se pudo.");
	});

	it("pendiente dice su palabra y no deja confirmar otra vez", () => {
		const h = mount(<ConfirmRow error={null} pending label="Borrar" pendingLabel="Borrando…" cancelLabel="Cancelar" onCancel={() => {}} onConfirm={() => {}} />);
		const confirm = h.querySelectorAll("button")[1] as HTMLButtonElement;
		expect(confirm.textContent).toBe("Borrando…");
		expect(confirm.disabled).toBe(true);
	});
});

describe("CopyButton", () => {
	it("con texto copia el valor y anuncia que se copió", async () => {
		const writeText = vi.fn(() => Promise.resolve());
		Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
		const h = mount(<CopyButton value="ABCD-1234" label="Copiar los códigos" text="Copiar" copiedLabel="Copiado" />);
		const b = h.querySelector("button")!;
		expect(b.textContent).toContain("Copiar");
		await act(async () => b.click());
		expect(writeText).toHaveBeenCalledWith("ABCD-1234");
		expect(h.querySelector("[aria-live='polite']")!.textContent).toBe("Copiado");
	});

	it("sin texto es un botón redondo con su nombre accesible", () => {
		const h = mount(<CopyButton value="x" label="Copiar el enlace" copiedLabel="Copiado" />);
		const b = h.querySelector("button")!;
		expect(b.getAttribute("aria-label")).toBe("Copiar el enlace");
		expect(b.classList.contains("vn-btn--icon")).toBe(true);
	});
});

// @vitest-environment jsdom
/**
 * La tabla y la cifra de Ventana (spec 2026-11-24-onview-admin-correos-ventana
 * §4.2): láminas sólidas para leer datos. La tabla es una `<table>` de verdad,
 * con nombre, que se desplaza dentro de su lámina y nunca ensancha la página.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, Stat, Tag, type Column } from "./data";

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
});

interface Sub {
	id: string;
	email: string;
	total: string;
}
const COLUMNS: Column<Sub>[] = [
	{ key: "email", header: "Customer", cell: (r) => r.email },
	{ key: "total", header: "Total", cell: (r) => r.total, numeric: true },
];
const ROWS: Sub[] = [
	{ id: "a", email: "ana@example.com", total: "$1,234,567.00" },
	{ id: "b", email: "bo@example.com", total: "$9.00" },
];

describe("DataTable", () => {
	it("es una tabla con nombre y una cabecera por columna", () => {
		const h = mount(<DataTable label="Subscriptions" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} empty="Nothing yet." />);
		const table = h.querySelector("table")!;
		expect(table.querySelector("caption")?.textContent).toBe("Subscriptions");
		expect(table.querySelector("caption")?.classList.contains("vn-sr-only")).toBe(true);
		expect(Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent)).toEqual(["Customer", "Total"]);
		expect(table.querySelectorAll("tbody tr").length).toBe(2);
	});

	it("sin filas no pinta una tabla vacía: pinta su frase", () => {
		const h = mount(<DataTable label="Subscriptions" columns={COLUMNS} rows={[]} rowKey={(r) => r.id} empty="Nothing yet." />);
		expect(h.querySelector("table")).toBeNull();
		expect(h.textContent).toContain("Nothing yet.");
	});

	it("cargando no pinta filas: pinta el esqueleto", () => {
		const h = mount(<DataTable label="Subscriptions" columns={COLUMNS} rows={[]} rowKey={(r) => r.id} empty="Nothing yet." loading />);
		expect(h.querySelector("tbody tr")).toBeNull();
		expect(h.textContent).not.toContain("Nothing yet.");
		expect(h.querySelector('[aria-busy="true"]')).not.toBeNull();
	});

	it("con onRowClick, la fila se abre con un botón de verdad en su primera celda", () => {
		const onRowClick = vi.fn();
		const h = mount(<DataTable label="Subscriptions" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} empty="" onRowClick={onRowClick} />);
		const first = h.querySelector("tbody tr")!;
		const button = first.querySelector("td button") as HTMLButtonElement;
		expect(button).not.toBeNull();
		expect(button.type).toBe("button");
		expect(first.getAttribute("onclick")).toBeNull();
		act(() => button.click());
		expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
	});

	it("una columna numérica va en cifras tabulares y alineada al final", () => {
		const h = mount(<DataTable label="Subscriptions" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} empty="" />);
		const cell = h.querySelectorAll("tbody tr")[0].querySelectorAll("td")[1];
		expect(cell.classList.contains("vn-table__num")).toBe(true);
	});

	it("se desplaza dentro de su lámina y un valor largo sin espacios no la rompe", () => {
		const h = mount(<DataTable label="Subscriptions" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} empty="" />);
		const scroller = h.querySelector("table")!.parentElement!;
		expect(scroller.classList.contains("vn-table__scroll")).toBe(true);
		expect(h.querySelector(".vn-table")?.closest(".vn-panel")).not.toBeNull();
	});
});

describe("Stat", () => {
	it("pinta el rótulo, la cifra y el detalle", () => {
		const h = mount(<Stat label="MRR" value="$12,400" detail="+4% this month" />);
		const stat = h.querySelector(".vn-stat")!;
		expect(stat.textContent).toContain("MRR");
		expect(stat.querySelector(".vn-stat__value")?.textContent).toBe("$12,400");
		expect(stat.querySelector(".vn-stat__detail")?.textContent).toBe("+4% this month");
	});

	it("en tono de peligro sólo cambia el detalle", () => {
		const h = mount(<Stat label="Past due" value="3" detail="Needs a look" tone="danger" />);
		const stat = h.querySelector(".vn-stat")!;
		expect(stat.getAttribute("data-tone")).toBe("danger");
	});
});

describe("Tag", () => {
	it("is a solid label with its tone, never glass", () => {
		const h = mount(
			<>
				<Tag>Draft</Tag>
				<Tag tone="solid">Active</Tag>
				<Tag tone="alert">Past due</Tag>
				<Tag tone="live">Live</Tag>
			</>,
		);
		const tags = Array.from(h.querySelectorAll(".vn-tag"));
		expect(tags.map((t) => t.getAttribute("data-tone"))).toEqual(["neutral", "solid", "alert", "live"]);
		expect(tags.map((t) => t.textContent)).toEqual(["Draft", "Active", "Past due", "Live"]);
		expect(h.querySelector(".vn-glass")).toBeNull();
	});
});

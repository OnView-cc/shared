// @vitest-environment jsdom
/**
 * Piezas sólidas de contenido de Ventana: Section, Row, Skeleton, Alert, Status,
 * Tabs, Progress, Accordion y Monogram. Ninguna lleva vidrio.
 */
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installRadixDom } from "../tests/helpers/radix-dom";
import { Accordion, Alert, Monogram, Progress, Row, Section, Skeleton, Status, Tabs } from "./content";

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

const tick = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

describe("Section", () => {
	it("enlaza su región con su título y respeta el nivel del encabezado", () => {
		const h = mount(
			<Section id="plan" title="Plan" meta="3 videos" action={<button type="button">Cambiar</button>}>
				<p>Cuerpo</p>
			</Section>,
		);
		const region = h.querySelector("section")!;
		const heading = h.querySelector("h2")!;
		expect(region.getAttribute("aria-labelledby")).toBe(heading.id);
		expect(heading.id).toBe("plan-title");
		expect(heading.textContent).toBe("Plan");
		expect(h.textContent).toContain("3 videos");
		expect(h.textContent).toContain("Cuerpo");
		expect(h.querySelector("button")?.textContent).toBe("Cambiar");
	});

	it("con level 3 el encabezado es un h3", () => {
		const h = mount(
			<Section id="x" title="Uno" level={3}>
				<p>.</p>
			</Section>,
		);
		expect(h.querySelector("h3")?.id).toBe("x-title");
		expect(h.querySelector("h2")).toBeNull();
	});
});

describe("Row", () => {
	it("con href toda la fila es un enlace con título y meta", () => {
		const h = mount(<Row title="Lanzamiento" meta="Hace 2 días" href="/video/1" lead={<i>L</i>} end={<span>3</span>} />);
		const a = h.querySelector("a")!;
		expect(a.getAttribute("href")).toBe("/video/1");
		expect(a.textContent).toContain("Lanzamiento");
		expect(a.textContent).toContain("Hace 2 días");
		expect(h.querySelector("button")).toBeNull();
	});

	it("con onClick es un botón type=button que lo llama", () => {
		const onClick = vi.fn();
		const h = mount(<Row title="Abrir" onClick={onClick} />);
		const b = h.querySelector("button")!;
		expect(b.getAttribute("type")).toBe("button");
		act(() => b.click());
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("sin href ni onClick es un div sin rol interactivo", () => {
		const h = mount(<Row title="Sólo lectura" meta="meta" />);
		expect(h.querySelector("a, button")).toBeNull();
		expect(h.querySelector(".vn-row")?.tagName).toBe("DIV");
	});
});

describe("Skeleton", () => {
	it("anuncia que está ocupado con su etiqueta y pinta las filas pedidas", () => {
		const h = mount(<Skeleton rows={3} label="Cargando" />);
		const s = h.querySelector("[aria-busy]")!;
		expect(s.getAttribute("aria-busy")).toBe("true");
		expect(s.getAttribute("aria-label")).toBe("Cargando");
		expect(s.querySelectorAll(".vn-skel__block").length).toBe(4);
		// Un marcador de posición no es una región viva: grupo con nombre, sin role=status
		expect(s.getAttribute("role")).toBe("group");
		expect(h.querySelector('[role="status"]')).toBeNull();
	});
	it("con muchas filas ninguna baja del 30% de ancho", () => {
		const h = mount(<Skeleton rows={12} label="Cargando" />);
		const widths = Array.from(h.querySelectorAll<HTMLElement>(".vn-skel__block")).slice(1).map((b) => parseFloat(b.style.inlineSize));
		expect(widths.length).toBe(12);
		expect(Math.min(...widths)).toBeGreaterThanOrEqual(30);
	});
});

describe("Alert", () => {
	it("sin texto no pinta nada", () => {
		const h = mount(<Alert error={null} />);
		expect(h.innerHTML).toBe("");
	});
	it("con el mensaje del error o con hijos tiene role=alert", () => {
		const h = mount(<Alert error={new Error("Se cayó")} />);
		expect(h.querySelector('[role="alert"]')?.textContent).toBe("Se cayó");
		act(() => root!.render(<Alert>Propio</Alert>));
		expect(h.querySelector('[role="alert"]')?.textContent).toBe("Propio");
	});
});

describe("Status", () => {
	it("con tone alert pinta título, cuerpo y pie y lleva data-tone", () => {
		const h = mount(
			<Status tone="alert" stamp={<b>Detenido</b>} title="Pago rechazado" footer={<button type="button">Reintentar</button>}>
				<p>Revisa tu tarjeta.</p>
			</Status>,
		);
		const box = h.querySelector(".vn-status")!;
		expect(box.getAttribute("data-tone")).toBe("alert");
		expect(box.textContent).toContain("Detenido");
		expect(box.textContent).toContain("Pago rechazado");
		expect(box.textContent).toContain("Revisa tu tarjeta.");
		expect(box.textContent).toContain("Reintentar");
	});
	it("por defecto el tono es ink", () => {
		const h = mount(<Status title="En revisión" />);
		expect(h.querySelector(".vn-status")?.getAttribute("data-tone")).toBe("ink");
	});
});

describe("Monogram", () => {
	it("cae a las iniciales cuando la imagen falla", () => {
		const h = mount(<Monogram name="Harbour & Pine" logoUrl="/x.png" size="sm" />);
		const img = h.querySelector("img")!;
		expect(img.getAttribute("alt")).toBe("");
		act(() => void img.dispatchEvent(new Event("error")));
		expect(h.querySelector("img")).toBeNull();
		const mark = h.querySelector(".vn-monogram")!;
		expect(mark.textContent).toBe("HP");
		expect(mark.getAttribute("aria-hidden")).toBe("true");
		expect(mark.className).toContain("vn-monogram--sm");
	});
	it("con un nombre vacío o sin letras cae a dos puntos medios", () => {
		const h = mount(<Monogram name="  " />);
		expect(h.querySelector(".vn-monogram")?.textContent).toBe("··");
		act(() => root!.render(<Monogram name="& -" />));
		expect(h.querySelector(".vn-monogram")?.textContent).toBe("··");
	});
	it("sin logo usa el inicio de un nombre de una palabra", () => {
		const h = mount(<Monogram name="onview" />);
		expect(h.querySelector(".vn-monogram")?.textContent).toBe("ON");
		expect(h.querySelector(".vn-monogram")?.className).toContain("vn-monogram--md");
	});
});

describe("opcionales", () => {
	it("el número 0 se muestra y vacío, nulo y false no pintan nada", () => {
		const h = mount(
			<Section id="z" title="T" meta={0} action={false}>
				<Row title="r" meta={0} lead={null} end="" />
				<Status title="t" footer={0} stamp={undefined}>
					{0}
				</Status>
			</Section>,
		);
		expect(h.querySelector(".vn-section__meta")?.textContent).toBe("0");
		expect(h.querySelector(".vn-section__action")).toBeNull();
		expect(h.querySelector(".vn-row__meta")?.textContent).toBe("0");
		expect(h.querySelector(".vn-row__lead")).toBeNull();
		expect(h.querySelector(".vn-row__end")).toBeNull();
		expect(h.querySelector(".vn-status__footer")?.textContent).toBe("0");
		expect(h.querySelector(".vn-status__text")?.textContent).toBe("0");
	});
});

describe("Progress", () => {
	it("value 0.4 vale 40 y se recorta fuera de 0..1", () => {
		const h = mount(<Progress value={0.4} label="Exportando" />);
		const p = () => h.querySelector('[role="progressbar"]')!;
		expect(p().getAttribute("aria-valuenow")).toBe("40");
		expect(p().getAttribute("aria-valuemin")).toBe("0");
		expect(p().getAttribute("aria-valuemax")).toBe("100");
		expect(p().getAttribute("aria-label")).toBe("Exportando");
		act(() => root!.render(<Progress value={1.7} label="Exportando" />));
		expect(p().getAttribute("aria-valuenow")).toBe("100");
		act(() => root!.render(<Progress value={-3} label="Exportando" />));
		expect(p().getAttribute("aria-valuenow")).toBe("0");
		act(() => root!.render(<Progress value={0.333} label="Exportando" />));
		expect(p().getAttribute("aria-valuenow")).toBe("33");
	});
});

describe("Tabs", () => {
	function Harness({ onChange }: { onChange: (v: string) => void }) {
		const [v, setV] = useState("a");
		return (
			<Tabs
				value={v}
				onChange={(next) => {
					onChange(next);
					setV(next);
				}}
				label="Secciones"
				tabs={[
					{ value: "a", label: "Uno", content: <p>Panel uno</p> },
					{ value: "b", label: "Dos", content: <p>Panel dos</p> },
				]}
			/>
		);
	}

	it("la flecha derecha pasa a la pestaña siguiente y llama onChange", async () => {
		const onChange = vi.fn();
		const h = mount(<Harness onChange={onChange} />);
		expect(h.querySelector('[role="tablist"]')?.getAttribute("aria-label")).toBe("Secciones");
		const tabs = () => Array.from(h.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
		expect(h.textContent).toContain("Panel uno");
		act(() => tabs()[0].focus());
		act(() => void tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
		await tick();
		expect(onChange).toHaveBeenCalledWith("b");
		expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
		expect(h.textContent).toContain("Panel dos");
	});
});

describe("Accordion", () => {
	it("abre y cierra con Enter y aria-expanded lo refleja; admite varios abiertos", () => {
		const h = mount(
			<Accordion
				items={[
					{ id: "p", title: "Pregunta uno", content: <p>Respuesta uno</p> },
					{ id: "q", title: "Pregunta dos", content: <p>Respuesta dos</p> },
				]}
			/>,
		);
		const [one, two] = Array.from(h.querySelectorAll<HTMLButtonElement>("button"));
		expect(one.getAttribute("aria-expanded")).toBe("false");
		// jsdom no convierte Enter en clic: se enfoca el botón real y se llama a click(), que es lo que hace el navegador
		act(() => one.focus());
		act(() => one.click());
		expect(one.getAttribute("aria-expanded")).toBe("true");
		expect(h.textContent).toContain("Respuesta uno");
		act(() => two.click());
		expect(one.getAttribute("aria-expanded")).toBe("true");
		expect(two.getAttribute("aria-expanded")).toBe("true");
		act(() => one.click());
		expect(one.getAttribute("aria-expanded")).toBe("false");
		expect(h.textContent).not.toContain("Respuesta uno");
	});
});

describe("material", () => {
	it("ninguna de las piezas sólidas lleva vn-glass", () => {
		const h = mount(
			<div>
				<Section id="s" title="T" meta="m" action={<span>a</span>}>
					<Row title="r" meta="m" href="#" end={<span>e</span>} />
					<Row title="r" onClick={() => {}} />
					<Row title="r" />
					<Skeleton label="c" />
					<Alert>x</Alert>
					<Status tone="alert" title="t" stamp="s" footer="f">
						c
					</Status>
					<Progress value={0.5} label="p" />
					<Monogram name="Ana Ruiz" />
					<Monogram name="Ana Ruiz" logoUrl="/a.png" />
					<Tabs value="a" onChange={() => {}} label="l" tabs={[{ value: "a", label: "A", content: "c" }]} />
					<Accordion items={[{ id: "i", title: "t", content: "c" }]} />
				</Section>
			</div>,
		);
		expect(h.innerHTML).not.toContain("vn-glass");
	});
});

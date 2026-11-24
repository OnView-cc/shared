/**
 * La tabla y la cifra de Ventana: láminas sólidas para leer datos (spec
 * 2026-11-24-onview-admin-correos-ventana §4.2). Nunca son vidrio.
 *
 * `DataTable` es una `<table>` real con su nombre en un `caption` oculto, dentro
 * de una `Panel` sin relleno que se desplaza en horizontal: una tabla ancha nunca
 * ensancha la página. Sin filas pinta `empty` (nunca una tabla vacía); cargando,
 * el esqueleto. Con `onRowClick`, la primera celda lleva un botón de verdad que
 * cubre la fila (por CSS): el teclado llega a él y Enter lo pulsa.
 *
 * `Stat` es una cifra grande en cifras tabulares con su rótulo y un detalle; en
 * tono de peligro sólo cambia el detalle. Todo texto llega por props.
 */
import type { ReactElement, ReactNode } from "react";
import { Panel, Skeleton } from "./content";

export interface Column<T> {
	key: string;
	header: ReactNode;
	cell: (row: T) => ReactNode;
	align?: "start" | "end";
	/** Cifras tabulares y alineada al final. */
	numeric?: boolean;
	/** Ancho de la columna (`12rem`, `30%`); sin él, el que pida su contenido. */
	width?: string;
}

function cellClass<T>(column: Column<T>): string | undefined {
	if (column.numeric) return "vn-table__num";
	return column.align === "end" ? "vn-table__end" : undefined;
}

export function DataTable<T>({
	label,
	columns,
	rows,
	rowKey,
	empty,
	onRowClick,
	loading = false,
}: {
	/** Nombre de la tabla para el lector de pantalla (y del esqueleto). */
	label: string;
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	/** Lo que se pinta sin filas: una frase, nunca una tabla vacía. */
	empty: ReactNode;
	onRowClick?: (row: T) => void;
	loading?: boolean;
}): ReactElement {
	if (loading) return <Skeleton rows={5} label={label} />;
	if (rows.length === 0) return <div className="vn-table__empty">{empty}</div>;
	return (
		<Panel className="vn-table__panel">
			<div className="vn-table__scroll">
				<table className="vn-table" data-clickable={onRowClick ? "" : undefined}>
					<caption className="vn-sr-only">{label}</caption>
					<thead>
						<tr>
							{columns.map((c) => (
								<th key={c.key} scope="col" className={cellClass(c)} style={c.width ? { inlineSize: c.width } : undefined}>
									{c.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={rowKey(row)}>
								{columns.map((c, i) => (
									<td key={c.key} className={cellClass(c)}>
										{i === 0 && onRowClick ? (
											<button type="button" className="vn-table__open" onClick={() => onRowClick(row)}>
												{c.cell(row)}
											</button>
										) : (
											c.cell(row)
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Panel>
	);
}

export function Stat({ label, value, detail, tone = "neutral" }: { label: ReactNode; value: ReactNode; detail?: ReactNode; tone?: "neutral" | "danger" }): ReactElement {
	return (
		// La lámina de `Panel` con su tono: la misma clase, sin pasar por su firma
		<div className="vn-panel vn-stat" data-tone={tone}>
			<p className="vn-stat__label">{label}</p>
			<p className="vn-stat__value">{value}</p>
			{detail != null && detail !== false && detail !== "" && <p className="vn-stat__detail">{detail}</p>}
		</div>
	);
}

/**
 * La etiqueta de estado de una fila o una ficha («Active», «Past due», «Live»):
 * sólida y pequeña, nunca vidrio. `neutral` es sólo filete; `solid`, tinta sobre
 * blanco; `alert`, el rojo de peligro en texto y filete; `live`, un punto delante.
 */
export function Tag({ tone = "neutral", children }: { tone?: "neutral" | "solid" | "alert" | "live"; children: ReactNode }): ReactElement {
	return (
		<span className="vn-tag" data-tone={tone}>
			{children}
		</span>
	);
}

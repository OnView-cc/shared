/**
 * Una base SQL de pruebas para `worker/`: `node:sqlite` detrás de la API de base
 * SQL que usan los workers (`prepare().bind().first/all/run` y `batch` todo o
 * nada con sus `changes` reales). La misma forma que `onview/tests/helpers/sql-db.ts`,
 * recortada a lo que usan los módulos de este paquete.
 */
import { DatabaseSync } from "node:sqlite";

type Row = Record<string, unknown>;

export function openSqlDb(schema: string): { db: D1Database; raw: DatabaseSync } {
	const raw = new DatabaseSync(":memory:");
	raw.exec(schema);
	const d1 = {
		prepare: (sql: string) => statement(raw, sql, []),
		batch: async (statements: D1PreparedStatement[]) => {
			raw.exec("BEGIN");
			try {
				const out = statements.map((s) => (s as unknown as { runSync: () => unknown }).runSync());
				raw.exec("COMMIT");
				return out;
			} catch (error) {
				raw.exec("ROLLBACK");
				throw error;
			}
		},
	};
	return { db: d1 as unknown as D1Database, raw };
}

function statement(raw: DatabaseSync, sql: string, params: unknown[]): D1PreparedStatement {
	const bound = params as (string | number | bigint | null | Uint8Array)[];
	const write = () => {
		const info = raw.prepare(sql).run(...bound);
		return { results: [], success: true, meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid), duration: 0 } };
	};
	const self = {
		bind: (...values: unknown[]) => statement(raw, sql, values),
		first: async <T>() => (raw.prepare(sql).get(...bound) as Row | undefined) ?? (null as T | null),
		all: async <T>() => ({ results: raw.prepare(sql).all(...bound) as T[], success: true, meta: { changes: 0 } }),
		run: async () => write(),
		runSync: () => write(),
	};
	return self as unknown as D1PreparedStatement;
}

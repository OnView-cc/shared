/**
 * Cobrar y devolver una reserva de créditos (`worker/credit-settle`), lo que
 * hacen onview y el estudio al terminar un trabajo. Las tres tablas son copia de
 * las de `onview/functions/_db/schema.sql`. Devolver dos veces suma una vez;
 * devolver tras cobrar no suma; una cubeta retirada no recibe nada.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { chargeReservation, releaseReservation } from "../worker/credit-settle";
import { openSqlDb } from "./helpers/sql-db";

const SCHEMA = `
CREATE TABLE credit_grants (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  kind        TEXT    NOT NULL CHECK (kind IN ('month', 'pack', 'initial', 'adjust')),
  source_key  TEXT    NOT NULL UNIQUE,
  credits     INTEGER NOT NULL CHECK (credits > 0),
  remaining   INTEGER NOT NULL CHECK (remaining >= 0),
  granted_at  INTEGER NOT NULL,
  expires_at  INTEGER,
  note        TEXT,
  revoked_at  INTEGER
);
CREATE TABLE credit_reservations (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  credits     INTEGER NOT NULL CHECK (credits > 0),
  state       TEXT    NOT NULL CHECK (state IN ('reserved', 'charged', 'released')),
  reason      TEXT    NOT NULL,
  meta        TEXT    NOT NULL DEFAULT '{}',
  created_at  INTEGER NOT NULL,
  settled_at  INTEGER
);
CREATE TABLE credit_allocations (
  reservation_id TEXT    NOT NULL REFERENCES credit_reservations(id) ON DELETE CASCADE,
  grant_id       TEXT    NOT NULL REFERENCES credit_grants(id) ON DELETE CASCADE,
  credits        INTEGER NOT NULL CHECK (credits > 0),
  PRIMARY KEY (reservation_id, grant_id)
);`;

const T = 1_800_000_000;
let db: D1Database;
let raw: ReturnType<typeof openSqlDb>["raw"];

const remaining = (id: string) => (raw.prepare("SELECT remaining FROM credit_grants WHERE id = ?").get(id) as { remaining: number }).remaining;
const state = (id: string) => (raw.prepare("SELECT state, settled_at FROM credit_reservations WHERE id = ?").get(id) as { state: string; settled_at: number | null });

beforeEach(() => {
	({ db, raw } = openSqlDb(SCHEMA));
	// 50 del mes y 100 iniciales; el trabajo job1 apartó 80: los 50 del mes y 30 de los iniciales.
	raw.exec(`INSERT INTO credit_grants (id, user_id, kind, source_key, credits, remaining, granted_at) VALUES ('month', 'u1', 'month', 'month:x', 50, 0, ${T - 100})`);
	raw.exec(`INSERT INTO credit_grants (id, user_id, kind, source_key, credits, remaining, granted_at) VALUES ('init', 'u1', 'initial', 'initial:u1', 100, 70, ${T - 100})`);
	raw.exec(`INSERT INTO credit_reservations (id, user_id, credits, state, reason, created_at) VALUES ('job1', 'u1', 80, 'reserved', 'video', ${T})`);
	raw.exec("INSERT INTO credit_allocations (reservation_id, grant_id, credits) VALUES ('job1', 'month', 50), ('job1', 'init', 30)");
});

describe("releaseReservation", () => {
	it("gives back to the same buckets once; a second release adds nothing", async () => {
		expect(await releaseReservation(db, "job1", T + 5)).toBe("released");
		expect(remaining("month")).toBe(50);
		expect(remaining("init")).toBe(100);
		expect(state("job1")).toEqual({ state: "released", settled_at: T + 5 });
		expect(await releaseReservation(db, "job1", T + 6)).toBe("noop");
		expect(remaining("init")).toBe(100);
		expect(state("job1").settled_at).toBe(T + 5);
	});

	it("after a charge does nothing: the credits stay spent", async () => {
		expect(await chargeReservation(db, "job1", T + 5)).toBe("charged");
		expect(await releaseReservation(db, "job1", T + 7)).toBe("noop");
		expect(remaining("month") + remaining("init")).toBe(70);
		expect(state("job1").state).toBe("charged");
	});

	it("a revoked bucket (a refunded pack) gets nothing back; the others do", async () => {
		raw.exec(`UPDATE credit_grants SET remaining = 0, revoked_at = ${T + 1} WHERE id = 'month'`);
		expect(await releaseReservation(db, "job1", T + 2)).toBe("released");
		expect(remaining("month")).toBe(0);
		expect(remaining("init")).toBe(100);
	});

	it("an unknown reservation is a noop", async () => {
		expect(await releaseReservation(db, "nope", T)).toBe("noop");
	});
});

describe("chargeReservation", () => {
	it("charges once, from reserved only", async () => {
		expect(await chargeReservation(db, "job1", T + 5)).toBe("charged");
		expect(state("job1")).toEqual({ state: "charged", settled_at: T + 5 });
		expect(await chargeReservation(db, "job1", T + 6)).toBe("noop");
		expect(state("job1").settled_at).toBe(T + 5);
	});

	it("after a release does nothing", async () => {
		await releaseReservation(db, "job1", T + 5);
		expect(await chargeReservation(db, "job1", T + 6)).toBe("noop");
		expect(state("job1").state).toBe("released");
	});
});

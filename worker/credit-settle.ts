/**
 * Cobrar o devolver una reserva de créditos: la mitad del libro de créditos que
 * hace falta en los dos lados. `onview` reserva (sabe el plan y el saldo) y el
 * estudio, al terminar un trabajo, cobra o devuelve con el id del trabajo, que es
 * el de la reserva. Las tablas (`credit_grants`, `credit_reservations`,
 * `credit_allocations`) viven en `onview/functions/_db/schema.sql`.
 *
 * Las dos son idempotentes: sólo actúan sobre una reserva en `reserved`, así que
 * un segundo aviso del mismo trabajo (una vigilancia, un reintento) no hace nada.
 * `now` en segundos.
 */

/** El trabajo salió: lo apartado queda gastado. Sólo desde `reserved`. */
export async function chargeReservation(db: D1Database, reservationId: string, now: number): Promise<"charged" | "noop"> {
	const r = await db
		.prepare("UPDATE credit_reservations SET state = 'charged', settled_at = ? WHERE id = ? AND state = 'reserved'")
		.bind(now, reservationId)
		.run();
	return (r.meta.changes ?? 0) > 0 ? "charged" : "noop";
}

/**
 * El trabajo falló: lo apartado vuelve a las mismas cubetas (aunque una haya
 * caducado entretanto: queda caducada). Sólo desde `reserved`; las dos
 * escrituras van en un batch, la devolución primero y condicionada al estado,
 * así que una segunda devolución no suma nada. Una cubeta retirada (el paquete
 * se reembolsó) no recibe nada: lo apartado de ella se pierde con ella.
 */
export async function releaseReservation(db: D1Database, reservationId: string, now: number): Promise<"released" | "noop"> {
	const results = await db.batch([
		db
			.prepare(
				`UPDATE credit_grants
				    SET remaining = remaining + (SELECT a.credits FROM credit_allocations a WHERE a.reservation_id = ? AND a.grant_id = credit_grants.id)
				  WHERE id IN (SELECT grant_id FROM credit_allocations WHERE reservation_id = ?)
				    AND revoked_at IS NULL
				    AND EXISTS (SELECT 1 FROM credit_reservations WHERE id = ? AND state = 'reserved')`,
			)
			.bind(reservationId, reservationId, reservationId),
		db.prepare("UPDATE credit_reservations SET state = 'released', settled_at = ? WHERE id = ? AND state = 'reserved'").bind(now, reservationId),
	]);
	return (results[1]?.meta.changes ?? 0) > 0 ? "released" : "noop";
}

/**
 * Un número que cambia (el saldo de créditos, un código de tiempo) lo hace de
 * golpe: pinta el valor nuevo y le da un resplandor ámbar que decae en 260ms
 * (`.sk-strike`, en `styles/sky.css`). Nunca rueda por los valores
 * intermedios: el número es un dato, no un espectáculo. El primer valor llega
 * quieto; cada cambio monta un `<span>` nuevo para que la animación vuelva a
 * correr.
 */
import { useRef } from "react";

/** True desde el primer cambio de `value`. */
export function useStrike(value: number): boolean {
	const previous = useRef(value);
	const changed = useRef(false);
	if (previous.current !== value) {
		previous.current = value;
		changed.current = true;
	}
	return changed.current;
}

export function StrikeNumber({ value, format, className = "" }: { value: number; format: (n: number) => string; className?: string }) {
	const struck = useStrike(value);
	return (
		<span key={value} className={`sk-num ${struck ? "sk-strike" : ""} ${className}`}>
			{format(value)}
		</span>
	);
}

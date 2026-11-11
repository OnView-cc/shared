/**
 * El desplegable del mundo de OnView («Feed vertical»), sobre Radix: el
 * disparador es un campo (`variant="field"`) o una píldora de la caja de
 * «Nuevo video» (`variant="chip"`), y las opciones un panel de niebla que sale
 * de su disparador. Sustituye al `<select>` nativo, cuya lista pinta el
 * sistema operativo en blanco y azul, fuera del mundo.
 *
 * Teclado, lector de pantalla y escribir para saltar los trae Radix. La opción
 * elegida lleva la marca en ámbar (lo elegido es ámbar); una opción que el
 * plan no da se ve apagada con su candado y la palabra que la trae (`hint`).
 *
 * El panel se monta en un portal fuera del mundo: lo envuelve un `div` con
 * `display: contents` y las clases del sitio donde vive el disparador (`sk`
 * en el sitio público, `site sk` dentro), que no pinta caja pero devuelve las
 * variables y los selectores de ese mundo.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { Select as S } from "radix-ui";

export interface SkOption {
	value: string;
	label: ReactNode;
	/** El texto del disparador si difiere de la fila («Voice: Iris» frente a «Iris»). */
	short?: ReactNode;
	/** Algo antes del texto: la muestra de un kit, un icono. */
	icon?: ReactNode;
	/** La palabra apagada al final de la fila («Pro»). */
	hint?: ReactNode;
	disabled?: boolean;
	/** Apagada porque el plan no la da: candado en vez de nada. */
	locked?: boolean;
}

export function SkSelect({
	value,
	onChange,
	options,
	label,
	id,
	variant = "field",
	disabled,
	icon,
	className = "",
	placeholder,
	describedBy,
	name,
}: {
	value: string;
	onChange: (value: string) => void;
	options: SkOption[];
	/** El nombre accesible: siempre, también cuando hay un `<label>` visible (Radix no lo lee del `for`). */
	label: string;
	id?: string;
	variant?: "field" | "chip";
	disabled?: boolean;
	/** Algo fijo antes del valor en el disparador. */
	icon?: ReactNode;
	className?: string;
	placeholder?: string;
	describedBy?: string;
	/** Para un formulario nativo: Radix monta un `<select>` oculto con este nombre. */
	name?: string;
}) {
	// Radix no admite el valor vacío en una opción: se traduce a un centinela.
	const EMPTY = "__sk_empty__";
	const enc = (v: string) => (v === "" ? EMPTY : v);
	const dec = (v: string) => (v === EMPTY ? "" : v);
	const current = options.find((o) => o.value === value);
	const trigger = useRef<HTMLButtonElement>(null);
	const [scope, setScope] = useState("site sk");
	useLayoutEffect(() => {
		setScope(trigger.current?.closest(".site") ? "site sk" : "sk");
	}, []);
	return (
		<S.Root value={enc(value)} onValueChange={(v) => onChange(dec(v))} disabled={disabled} name={name}>
			<S.Trigger ref={trigger} id={id} aria-label={label} aria-describedby={describedBy} className={`sk-select-trigger sk-select-trigger--${variant} ${className}`}>
				{icon ?? current?.icon}
				<span className="min-w-0 truncate">
					<S.Value placeholder={placeholder}>{current ? (current.short ?? current.label) : placeholder}</S.Value>
				</span>
				<S.Icon asChild>
					<ChevronDown className="sk-select-chevron" strokeWidth={2} aria-hidden="true" />
				</S.Icon>
			</S.Trigger>
			<S.Portal>
				<div className={scope} style={{ display: "contents" }}>
					<S.Content position="popper" side="bottom" align="start" sideOffset={6} collisionPadding={12} className="sk-select-panel">
						<S.Viewport className="sk-select-viewport">
							{options.map((o) => (
								<S.Item key={o.value} value={enc(o.value)} disabled={o.disabled || o.locked} className="sk-select-item">
									{o.icon}
									<S.ItemText>{o.label}</S.ItemText>
									{(o.hint || o.locked) && (
										<span className="sk-select-hint">
											{o.locked && <Lock className="size-3" strokeWidth={2} aria-hidden="true" />}
											{o.hint}
										</span>
									)}
									<S.ItemIndicator className="sk-select-check">
										<Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
									</S.ItemIndicator>
								</S.Item>
							))}
						</S.Viewport>
					</S.Content>
				</div>
			</S.Portal>
		</S.Root>
	);
}

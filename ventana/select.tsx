/**
 * El desplegable de Ventana, sobre Radix: el disparador es un campo sólido
 * (`variant="field"`) o una cápsula sólida (`variant="chip"`), y la lista es un
 * panel de vidrio grueso que crece desde su disparador. Misma firma que
 * `SkSelect` de `sky/select.tsx` (mismas props, misma forma de `Option`, mismo
 * centinela para el valor vacío) con clases `vn-select-*`.
 *
 * Teclado, lector de pantalla y escribir para saltar los trae Radix. La opción
 * elegida lleva una marca en tinta; una opción que el plan no da se ve apagada
 * con su candado y la palabra que la trae (`hint`).
 *
 * Diferencias con sky, a propósito: el portal se envuelve siempre en
 * `<div className="vn" style="display: contents">` (sin detectar el sitio donde
 * vive el disparador) y la marca de lo elegido no es ámbar.
 *
 * Materiales: el disparador es sólido (nunca `vn-glass`); sólo flota la lista.
 * `className` va en el disparador, como en sky.
 */
import type { ReactNode } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { Select as S } from "radix-ui";

export interface Option {
	value: string;
	label: ReactNode;
	/** El texto del disparador si difiere de la fila («Voz: Iris» frente a «Iris»). */
	short?: ReactNode;
	/** Algo antes del texto: la muestra de un kit, un icono. */
	icon?: ReactNode;
	/** La palabra apagada al final de la fila («Pro»). */
	hint?: ReactNode;
	disabled?: boolean;
	/** Apagada porque el plan no la da: candado en vez de nada. */
	locked?: boolean;
}

export function Select({
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
	options: Option[];
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
	const EMPTY = "__vn_empty__";
	const enc = (v: string) => (v === "" ? EMPTY : v);
	const dec = (v: string) => (v === EMPTY ? "" : v);
	const current = options.find((o) => o.value === value);
	return (
		<S.Root value={enc(value)} onValueChange={(v) => onChange(dec(v))} disabled={disabled} name={name}>
			<S.Trigger id={id} aria-label={label} aria-describedby={describedBy} className={`vn-select-trigger vn-select-trigger--${variant} ${className}`.trim()}>
				{icon ?? current?.icon}
				<span className="vn-select-value">
					<S.Value placeholder={placeholder}>{current ? (current.short ?? current.label) : placeholder}</S.Value>
				</span>
				<S.Icon asChild>
					<ChevronDown className="vn-select-chevron" strokeWidth={2} aria-hidden="true" />
				</S.Icon>
			</S.Trigger>
			<S.Portal>
				<div className="vn" style={{ display: "contents" }}>
					<S.Content position="popper" side="bottom" align="start" sideOffset={6} collisionPadding={12} className="vn-select-panel vn-glass vn-glass--thick">
						<S.Viewport className="vn-select-viewport">
							{options.map((o) => (
								<S.Item key={o.value} value={enc(o.value)} disabled={o.disabled || o.locked} className="vn-select-item">
									{o.icon}
									<S.ItemText>{o.label}</S.ItemText>
									{(o.hint || o.locked) && (
										<span className="vn-select-hint">
											{o.locked && <Lock className="vn-select-lock" strokeWidth={2} aria-hidden="true" />}
											{o.hint}
										</span>
									)}
									<S.ItemIndicator className="vn-select-check">
										<Check strokeWidth={2.25} aria-hidden="true" />
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

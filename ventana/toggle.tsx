/**
 * Interruptor y casilla de Ventana, ambos sólidos (nunca vidrio): apagado sobre
 * `--vn-raised`, encendido sobre `--vn-ink` con la perilla o la marca en
 * `--vn-action-ink`. Sin color de acento.
 *
 * `Switch`: un `<button role="switch">` con `label` como nombre accesible, de
 * 51 x 31px a la vista y 44px de alto de toque. Espacio alterna (se resuelve en
 * keyup, como un botón nativo, y se cancela el clic para no alternar dos veces).
 * `Check`: misma estructura que `Check` de `sky/console.tsx` (casilla nativa
 * escondida bajo un cuadro, los hijos como su etiqueta); sky usa clases de
 * Tailwind y aquí van clases `vn-*`.
 */
import { useId, type KeyboardEvent, type ReactNode } from "react";
import { Check as CheckIcon } from "lucide-react";

export function Switch({
	id,
	checked,
	onChange,
	disabled = false,
	label,
}: {
	id?: string;
	checked: boolean;
	onChange: (next: boolean) => void;
	disabled?: boolean;
	label: string;
}) {
	function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		// Espacio no desplaza la página; la acción llega en keyup.
		if (event.key === " ") event.preventDefault();
	}
	function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key !== " ") return;
		event.preventDefault();
		if (!disabled) onChange(!checked);
	}
	return (
		<button
			id={id}
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			className="vn-switch vn-press"
			onClick={() => onChange(!checked)}
			onKeyDown={onKeyDown}
			onKeyUp={onKeyUp}>
			<span aria-hidden="true" className="vn-switch__track">
				<span className="vn-switch__knob" />
			</span>
		</button>
	);
}

export function Check({
	id,
	checked,
	onChange,
	disabled = false,
	children,
}: {
	id?: string;
	checked: boolean;
	onChange: (next: boolean) => void;
	/** Atenuada y sin cursor de mano: el motivo lo dice el texto de al lado. */
	disabled?: boolean;
	children: ReactNode;
}) {
	const fallback = useId();
	const inputId = id ?? fallback;
	return (
		<label htmlFor={inputId} className="vn-check" data-disabled={disabled ? "" : undefined}>
			<span className="vn-check__control">
				<input
					id={inputId}
					type="checkbox"
					checked={checked}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
					className="vn-check__input"
				/>
				<span aria-hidden="true" className="vn-check__box">
					{checked && <CheckIcon className="vn-check__tick" strokeWidth={3} />}
				</span>
			</span>
			<span className="vn-check__text">{children}</span>
		</label>
	);
}

/**
 * Campos de Ventana: de una línea (`TextField`) y de varias (`TextArea`). Son
 * sólidos, nunca vidrio: un formulario es texto que se lee y se escribe. Todo el
 * texto visible (etiqueta, ayuda, error) llega por props.
 * Misma firma y mismo cableado de accesibilidad que `TextField` de `sky/console.tsx`
 * (etiqueta con `for`, `aria-invalid`, `aria-describedby`), con clases `vn-*`.
 */
import { useLayoutEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">;

const join = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

/**
 * Una cuenta que sólo aparece cuando merece saberse: a los tres cuartos del techo,
 * y en el color de error en el techo. En 0/80 desde el principio se lee como algo
 * que hay que llenar.
 */
function Count({ value, max }: { value: string; max: number }) {
	if (value.length < max * 0.75) return null;
	return (
		<span className={join("vn-field__count", "vn-num", value.length >= max && "vn-field__count--full")}>
			{value.length}/{max}
		</span>
	);
}

/** Etiqueta con su cuenta, el control y la línea de aviso: el error, o la ayuda, o nada. */
function Shell({
	id,
	label,
	hint,
	error,
	counter,
	reserve,
	className,
	children,
}: {
	id: string;
	label: ReactNode;
	hint?: ReactNode;
	error?: ReactNode;
	counter?: ReactNode;
	/** La línea de aviso guarda su sitio aunque esté vacía, para que el error no empuje lo de abajo. */
	reserve: boolean;
	className?: string;
	children: ReactNode;
}) {
	const hasError = error !== undefined && error !== null && error !== false && error !== "";
	const hasHint = !hasError && hint !== undefined && hint !== null && hint !== false && hint !== "";
	return (
		<div className={join("vn-field", hasError && "vn-field--error", className)}>
			<div className="vn-field__head">
				<label htmlFor={id} className="vn-label vn-field__label">
					{label}
				</label>
				{counter}
			</div>
			{children}
			{hasError ? (
				<p id={`${id}-error`} role="alert" className="vn-small vn-field__msg vn-field__msg--error">
					{error}
				</p>
			) : hasHint ? (
				<p id={`${id}-hint`} className="vn-small vn-field__msg">
					{hint}
				</p>
			) : reserve ? (
				<p aria-hidden="true" className="vn-small vn-field__msg" />
			) : null}
		</div>
	);
}

/** Qué id de aviso le toca al campo: el error manda sobre la ayuda. */
function describedBy(id: string, hint: ReactNode, error: ReactNode): string | undefined {
	if (error !== undefined && error !== null && error !== false && error !== "") return `${id}-error`;
	if (hint !== undefined && hint !== null && hint !== false && hint !== "") return `${id}-hint`;
	return undefined;
}

/** Un campo de una línea. `cond` lo pone en cifras tabulares, para identificadores. */
export function TextField({
	id,
	label,
	value,
	onChange,
	max,
	hint,
	error,
	cond = false,
	className,
	...input
}: InputProps & {
	id: string;
	label: ReactNode;
	value: string;
	onChange: (value: string) => void;
	max?: number;
	hint?: ReactNode;
	error?: ReactNode;
	cond?: boolean;
	className?: string;
}) {
	const invalid = describedBy(id, undefined, error) !== undefined;
	return (
		<Shell
			id={id}
			label={label}
			hint={hint}
			error={error}
			reserve
			className={className}
			// Sin cuenta en un campo de dos letras: «2/2» en rojo en un código de país
			// lleno es una alarma por hacer bien el campo.
			counter={max && max >= 20 ? <Count value={value} max={max} /> : undefined}
		>
			<input
				{...input}
				id={id}
				value={value}
				maxLength={max}
				aria-invalid={invalid ? true : undefined}
				aria-describedby={describedBy(id, hint, error)}
				onChange={(e) => onChange(e.target.value)}
				className={join("vn-input", cond && "vn-num")}
			/>
		</Shell>
	);
}

const LINE_FALLBACK_PX = 22;

/**
 * La variante de varias líneas: crece con el texto hasta `maxRows` líneas y
 * entonces se desplaza. No reserva línea de aviso si no hay ayuda ni error que dar.
 */
export function TextArea({
	id,
	label,
	value,
	onChange,
	hint,
	error,
	maxRows = 10,
	className,
	...rest
}: {
	id: string;
	label: ReactNode;
	value: string;
	onChange: (value: string) => void;
	hint?: ReactNode;
	error?: ReactNode;
	maxRows?: number;
	className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "id">) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const invalid = describedBy(id, undefined, error) !== undefined;

	// Mide con el alto automático y fija el resultado, con tope en maxRows líneas.
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const css = getComputedStyle(el);
		const px = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);
		const line = px(css.lineHeight) || LINE_FALLBACK_PX;
		const chrome = px(css.paddingTop) + px(css.paddingBottom) + px(css.borderTopWidth) + px(css.borderBottomWidth);
		el.style.height = "auto";
		const wanted = el.scrollHeight + px(css.borderTopWidth) + px(css.borderBottomWidth);
		const cap = Math.max(1, maxRows) * line + chrome;
		el.style.height = `${Math.min(wanted, cap)}px`;
		el.style.overflowY = wanted > cap ? "auto" : "hidden";
	}, [value, maxRows]);

	return (
		<Shell id={id} label={label} hint={hint} error={error} reserve={hint !== undefined || error !== undefined} className={className}>
			<textarea
				rows={1}
				{...rest}
				ref={ref}
				id={id}
				value={value}
				aria-invalid={invalid ? true : undefined}
				aria-describedby={describedBy(id, hint, error)}
				onChange={(e) => onChange(e.target.value)}
				className="vn-input vn-input--area"
			/>
		</Shell>
	);
}

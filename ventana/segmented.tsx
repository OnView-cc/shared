/**
 * Control segmentado de Ventana. Mismas props que `Segmented` de `sky/page.tsx`.
 * Diferencias deliberadas: es un `radiogroup` con radios (no `group` con
 * `aria-pressed`), con tabindex móvil (sólo la elegida entra por tabulador),
 * flechas, Inicio y Fin que mueven elección y foco sin salirse de los extremos.
 *
 * Materiales: el riel es sólido; el pulgar es el único vidrio (claro, porque no
 * lleva texto: las etiquetas están en los botones, encima). El pulgar se coloca
 * con `--vn-seg-x` y `--vn-seg-w`, medidos del botón elegido y vueltos a medir
 * con `ResizeObserver`. No anima al primer pintado: la transición se habilita
 * (`data-ready`) cuando ya hubo una medida pintada; con movimiento reducido
 * lleva `data-still` y no se desliza. Una medida de 0 (dentro de una `Sheet`, el
 * segmentado se mide antes de que el diálogo se abra) no cuenta: el pulgar espera
 * oculto a la primera de verdad, que llega con el `ResizeObserver`.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "./hooks";

export function Segmented<T extends string>({
	value,
	options,
	onChange,
	label,
}: {
	value: T;
	options: { value: T; label: ReactNode }[];
	onChange: (v: T) => void;
	label: string;
}) {
	const track = useRef<HTMLDivElement>(null);
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const [box, setBox] = useState<{ x: number; w: number } | null>(null);
	const [ready, setReady] = useState(false);
	const still = useReducedMotion();
	const selected = options.findIndex((o) => o.value === value);

	const measure = useCallback(() => {
		const el = selected >= 0 ? refs.current[selected] : null;
		setBox((prev) => {
			// Sin opción elegida, o dentro de algo que aún no se pinta (una `Sheet` cerrada mide 0):
			// no hay medida. El pulgar sigue oculto y la primera medida de verdad no se desliza.
			if (!el || el.offsetWidth === 0) return prev === null ? prev : null;
			const next = { x: el.offsetLeft, w: el.offsetWidth };
			return prev && prev.x === next.x && prev.w === next.w ? prev : next;
		});
	}, [selected]);

	// Medir antes de pintar: la primera posición ya sale colocada, sin deslizarse desde 0.
	useLayoutEffect(measure, [measure, options.length]);

	// Habilitar la transición sólo después de que la primera medida se pintó.
	useEffect(() => {
		if (!box || ready) return;
		const id = requestAnimationFrame(() => setReady(true));
		return () => cancelAnimationFrame(id);
	}, [box, ready]);

	// Se vuelve a medir si cambia el tamaño del riel o de un botón (fuente, idioma, etiqueta, ventana).
	useEffect(() => {
		if (typeof ResizeObserver === "undefined" || !track.current) return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(track.current);
		for (const el of refs.current) if (el) ro.observe(el);
		return () => ro.disconnect();
	}, [measure, options.length]);

	function go(index: number) {
		const option = options[index];
		if (!option) return;
		// En un extremo no hay cambio: no se avisa de una elección que no cambia.
		if (index !== selected) onChange(option.value);
		refs.current[index]?.focus();
	}

	function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
		// Alt, Ctrl y Meta son del navegador (Alt+Flecha es atrás/adelante): no se tragan.
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		const last = options.length - 1;
		let to: number | null = null;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") to = Math.min(last, index + 1);
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = Math.max(0, index - 1);
		else if (event.key === "Home") to = 0;
		else if (event.key === "End") to = last;
		if (to === null) return;
		event.preventDefault();
		go(to);
	}

	const style = box ? ({ "--vn-seg-x": `${box.x}px`, "--vn-seg-w": `${box.w}px` } as CSSProperties) : undefined;
	// Sin elección válida, el único que entra por tabulador es el primero.
	const tabbable = selected >= 0 ? selected : 0;

	return (
		<div ref={track} role="radiogroup" aria-label={label} className="vn-seg">
			<span
				aria-hidden="true"
				className="vn-seg-thumb vn-glass vn-glass--clear"
				style={style}
				data-hidden={box ? undefined : ""}
				data-ready={ready && !still ? "" : undefined}
				data-still={still ? "" : undefined}
			/>
			{options.map((option, i) => (
				<button
					key={option.value}
					ref={(el) => {
						refs.current[i] = el;
					}}
					type="button"
					role="radio"
					aria-checked={i === selected}
					tabIndex={i === tabbable ? 0 : -1}
					className="vn-seg-opt"
					onClick={() => onChange(option.value)}
					onKeyDown={(e) => onKeyDown(e, i)}>
					{option.label}
				</button>
			))}
		</div>
	);
}

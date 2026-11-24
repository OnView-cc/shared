/**
 * Los hooks de Ventana: la anchura, el movimiento reducido, el paso con
 * flechas, el aviso que se apaga solo y la parada de la URL. Vienen de
 * `sky/hooks.ts` (Feed vertical) y se quedan aquí cuando aquél se borra
 * (parte 5 de la serie). Lo que sólo servía a las piezas viejas no se trajo:
 * `useDismiss` (los flotantes de Ventana se cierran solos), `useClockMs`,
 * `useInView` y `useMountVisible`.
 *
 * Un módulo propio en vez de vivir junto a los componentes: Fast Refresh sólo
 * vuelve a renderizar un archivo que exporta componentes y nada más.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

/** `true` por debajo de la anchura dada; se reevalúa al redimensionar. */
export function useNarrow(query = "(max-width: 47.9rem)"): boolean {
	const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
	useEffect(() => {
		const mq = window.matchMedia(query);
		setNarrow(mq.matches);
		const onChange = () => setNarrow(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [query]);
	return narrow;
}

/** `true` cuando la persona pidió menos movimiento; se reevalúa si cambia. */
export function useReducedMotion(): boolean {
	return useNarrow("(prefers-reduced-motion: reduce)");
}

/** Cuánto dura el «Saved.» junto a un botón: 4 s, lo que duraba en Feed vertical. */
export const FLASH_MS = 4000;

/** Un aviso que se enciende y se apaga solo; un segundo aviso lo reinicia. */
export function useFlash(): [boolean, () => void] {
	const [on, setOn] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);
	const flash = useCallback(() => {
		setOn(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setOn(false), FLASH_MS);
	}, []);
	return [on, flash];
}

/**
 * Lleva a la parada que nombra la URL (`#members`, o `fallback`) una vez que
 * existe: el navegador no puede hacerlo solo porque aún no está pintada al cargar.
 */
export function useScrollToStop(ready: boolean, fallback?: string): void {
	const done = useRef(false);
	useEffect(() => {
		if (!ready || done.current) return;
		const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
		const id = hash || fallback;
		if (!id) return;
		done.current = true;
		requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
	}, [ready, fallback]);
}

/** Lo que escribe la persona no mueve nada: dentro de un campo, las flechas son del campo. */
function isTyping(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/**
 * El paso con las flechas: abajo o a la derecha, el siguiente; arriba o a la
 * izquierda, el anterior; sin salirse de los límites. Devuelve el manejador
 * para el `onKeyDown` del contenedor.
 */
export function useStepKeys({ count, index, onIndex, keys }: { count: number; index: number; onIndex: (i: number) => void; keys?: "vertical" | "horizontal" }) {
	return useCallback(
		(e: ReactKeyboardEvent | KeyboardEvent) => {
			if (isTyping(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
			const next = keys === "horizontal" ? { ArrowRight: 1, ArrowLeft: -1 } : keys === "vertical" ? { ArrowDown: 1, ArrowUp: -1 } : { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
			const step = next[e.key as keyof typeof next];
			if (!step) return;
			const to = Math.min(count - 1, Math.max(0, index + step));
			e.preventDefault();
			if (to !== index) onIndex(to);
		},
		[count, index, onIndex, keys],
	);
}

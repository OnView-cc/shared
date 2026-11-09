/**
 * La hoja de contactos de Blue Hour: un video es una tira de fotogramas en un
 * borde de película (perforaciones arriba y abajo, números de fotograma en el
 * margen, en la voz estrecha del borde). El lápiz graso ámbar rodea el
 * fotograma elegido; los otros siguen en la hoja. Con `onChoose`, cada
 * fotograma es un botón (`aria-pressed`) y elegir otro vuelve a trazar el
 * círculo; sin él, la tira es una lista quieta.
 *
 * Desbordada, la tira se desplaza dentro de su carril y se asienta en el paso
 * del fotograma (`scroll-snap`); la página nunca desborda. Al montarse, el carril
 * se coloca con el fotograma elegido a la vista. `exampleLabel` escribe
 * «Ejemplo» en el borde cuando los fotogramas son demostración. Una toma
 * descartada lleva la cruz del lápiz (`mark: "cross"`) y sigue en la hoja:
 * nada se pierde.
 */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Grease } from "./grease";

export interface StripFrame {
	id: string;
	/** El texto en pantalla de la toma, si lo tiene. */
	caption?: string;
	/** Lo que se ve dentro del fotograma (un clip, una imagen, un cielo). */
	media?: ReactNode;
	/** La duración de la toma, para el ancho proporcional donde se use. */
	seconds?: number;
	/** Una toma descartada: la cruz del lápiz graso, y sigue en la hoja. */
	mark?: "cross";
}

const number = (i: number) => String(i + 1).padStart(2, "0");

export function ContactStrip({
	frames,
	chosen,
	onChoose,
	label,
	exampleLabel,
	className = "",
}: {
	frames: StripFrame[];
	chosen?: number;
	onChoose?: (index: number) => void;
	/** El nombre de la tira para los lectores de pantalla (del diccionario). */
	label: string;
	exampleLabel?: string;
	className?: string;
}) {
	const rail = useRef<HTMLOListElement>(null);
	// Al montarse, el fotograma elegido queda a la vista dentro del carril (en
	// móvil el carril desborda); sólo el carril se mueve, nunca la página.
	useLayoutEffect(() => {
		const el = rail.current;
		if (!el || chosen === undefined || el.scrollWidth <= el.clientWidth) return;
		const cell = el.children[chosen] as HTMLElement | undefined;
		if (cell) el.scrollLeft = Math.max(0, cell.offsetLeft - (el.clientWidth - cell.offsetWidth) / 2);
	}, []);

	return (
		<section className={`sk-strip ${className}`} aria-label={label}>
			{exampleLabel && <span className="sk-strip-example sk-edge">{exampleLabel}</span>}
			<div className="sk-perf" aria-hidden="true" />
			<ol ref={rail} className="sk-strip-rail">
				{frames.map((frame, i) => {
					const isChosen = chosen === i;
					const body = (
						<>
							<span className="sk-frame-media">{frame.media}</span>
							{frame.caption && <span className="sk-frame-caption">{frame.caption}</span>}
							{frame.mark === "cross" && <Grease kind="cross" className="sk-frame-cross" />}
							{isChosen && <Grease kind="circle" draw={Boolean(onChoose)} className="sk-frame-grease" />}
						</>
					);
					return (
						<li key={frame.id} className="sk-strip-cell">
							{onChoose ? (
								<button type="button" className="sk-frame" aria-pressed={isChosen} aria-label={`${number(i)}${frame.caption ? `. ${frame.caption}` : ""}`} onClick={() => onChoose(i)}>
									{body}
								</button>
							) : (
								<div className="sk-frame">{body}</div>
							)}
							<span className="sk-frame-no sk-edge" aria-hidden="true">
								{number(i)}
							</span>
						</li>
					);
				})}
			</ol>
			<div className="sk-perf" aria-hidden="true" />
		</section>
	);
}

// Genera `styles/ventana/motion.css` desde `ventana/springs.ts`.
// Uso: `npm run springs` (node --experimental-strip-types).
import { writeFileSync } from "node:fs";
import { SPRINGS, springLinear } from "../ventana/springs.ts";

const tokens = Object.keys(SPRINGS)
	.map((k) => {
		const { easing, durationMs } = springLinear(SPRINGS[k]);
		return `\t--vn-spring-${k}: ${easing};\n\t--vn-spring-${k}-ms: ${durationMs}ms;`;
	})
	.join("\n");

const css = `/*
 * Ventana: movimiento. GENERADO, no editar: \`npm run springs\` (scripts/gen-springs.mjs
 * a partir de ventana/springs.ts).
 */
.vn {
${tokens}
	--vn-ease-out: cubic-bezier(0.32, 0.72, 0, 1);
}

/*
 * Llegada: sube, se aclara y se enfoca con el muelle suave. \`--vn-i\` escalona 60ms por hermano.
 * En reposo el filtro es \`none\`, no \`blur(0)\`: cualquier filtro (y la opacidad a medias de
 * la entrada) hace del elemento la raíz del fondo de sus hijos, y un vidrio de dentro
 * dejaría de ver el video. Por lo mismo, la clase va en la propia pieza de vidrio, no en
 * un envoltorio que la contenga.
 */
.vn-arrive {
	opacity: 1;
	translate: 0 0;
	scale: 1;
	filter: none;
	transition:
		opacity var(--vn-spring-soft-ms) var(--vn-ease-out),
		translate var(--vn-spring-soft-ms) var(--vn-spring-soft),
		scale var(--vn-spring-soft-ms) var(--vn-spring-soft),
		filter var(--vn-spring-soft-ms) var(--vn-ease-out);
	transition-delay: calc(var(--vn-i, 0) * 60ms);
	@starting-style {
		opacity: 0;
		translate: 0 10px;
		scale: 0.96;
		filter: blur(6px);
	}
}

/* Pulsación: se hunde un poco con el muelle vivo. */
.vn-press {
	transition: scale var(--vn-spring-snap-ms) var(--vn-spring-snap);
}
.vn-press:active {
	scale: 0.97;
}

/* Las dos a la vez: \`.vn-press\` fija \`transition\` entera y pisaría la llegada. Aquí conviven; la escala usa el muelle vivo, que también sirve para llegar. */
.vn-arrive.vn-press {
	transition:
		opacity var(--vn-spring-soft-ms) var(--vn-ease-out),
		translate var(--vn-spring-soft-ms) var(--vn-spring-soft),
		scale var(--vn-spring-snap-ms) var(--vn-spring-snap),
		filter var(--vn-spring-soft-ms) var(--vn-ease-out);
}

/* Movimiento reducido: sólo opacidad, en un fundido corto (los 500 ms del muelle son para algo que se mueve) */
@media (prefers-reduced-motion: reduce) {
	.vn-arrive {
		transition: opacity 200ms linear;
		transition-delay: 0ms;
		@starting-style {
			opacity: 0;
			translate: none;
			scale: 1;
			filter: none;
		}
	}
	.vn-press {
		transition: none;
	}
	.vn-arrive.vn-press {
		transition: opacity 200ms linear;
	}
	.vn-press:active {
		scale: 1;
	}
}
`;

writeFileSync(new URL("../styles/ventana/motion.css", import.meta.url), css);

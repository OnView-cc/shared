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
 * Llegada: sube, crece y se enfoca con el muelle suave. \`--vn-i\` escalona 60ms por hermano.
 *
 * La regla, en todas partes: \`vn-arrive\` va en la propia pieza, NUNCA en un envoltorio que
 * contenga un vidrio. Mientras llega, la opacidad a medias y el desenfoque hacen del elemento
 * la raíz del fondo de sus hijos: un vidrio de dentro dejaría de ver el video. En la propia
 * pieza de vidrio eso no pasa (lo que se aclara es el vidrio entero, con su fondo).
 *
 * Es una animación de fotogramas y no una transición: no choca con la \`transition\` de ninguna
 * pieza (\`.vn-press\`, \`.vn-btn\`, \`.vn-chip--solid\`, la barra de navegación), así que va en un
 * botón, un chip o la barra igual que en un panel, y convive con \`vn-press\`. Llena hacia
 * atrás (\`backwards\`: durante el escalonado ya está en su punto de partida) y no hacia
 * delante: al acabar no deja ni filtro ni opacidad y la pieza vuelve a sus valores.
 */
.vn-arrive {
	animation: vn-arrive var(--vn-spring-soft-ms) var(--vn-spring-soft) backwards;
	animation-delay: calc(var(--vn-i, 0) * 60ms);
}
@keyframes vn-arrive {
	from {
		opacity: 0;
		translate: 0 10px;
		scale: 0.96;
		filter: blur(6px);
	}
}
@keyframes vn-arrive-fade {
	from {
		opacity: 0;
	}
}

/* Pulsación: se hunde un poco con el muelle vivo. */
.vn-press {
	transition: scale var(--vn-spring-snap-ms) var(--vn-spring-snap);
}
.vn-press:active {
	scale: 0.97;
}

/* Movimiento reducido: la llegada es sólo un fundido corto y sin escalonado (los 500 ms del muelle son para algo que se mueve) */
@media (prefers-reduced-motion: reduce) {
	.vn-arrive {
		animation: vn-arrive-fade 200ms linear backwards;
		animation-delay: 0ms;
	}
	.vn-press {
		transition: none;
	}
	.vn-press:active {
		scale: 1;
	}
}
`;

writeFileSync(new URL("../styles/ventana/motion.css", import.meta.url), css);

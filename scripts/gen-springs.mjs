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

/* Llegada: sube, se aclara y se enfoca con el muelle suave. \`--vn-i\` escalona 60ms por hermano. */
.vn-arrive {
	opacity: 1;
	translate: 0 0;
	scale: 1;
	filter: blur(0);
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

/* Movimiento reducido: sólo opacidad */
@media (prefers-reduced-motion: reduce) {
	.vn-arrive {
		transition: opacity var(--vn-spring-snap-ms) linear;
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
	.vn-press:active {
		scale: 1;
	}
}
`;

writeFileSync(new URL("../styles/ventana/motion.css", import.meta.url), css);

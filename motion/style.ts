/**
 * El CSS del motor, como texto: el motor lo inyecta una vez por documento, así
 * funciona igual en el editor (Vite), en la página del Container (esbuild) y en
 * las pruebas. Sin `@font-face` (las fuentes las pone quien monta el motor) y
 * **sin ninguna transición ni animación CSS**: todo lo que se mueve lo mueve la
 * línea de tiempo, para que un mismo `seek` dé siempre el mismo cuadro.
 */
export const MOTION_CSS = `
.motion-stage { position: absolute; left: 0; top: 0; overflow: hidden; transform-origin: 0 0; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; contain: strict; }
.motion-camera, .motion-hit { position: absolute; inset: 0; }
.motion-bg { position: absolute; inset: 0; }
.motion-blob { position: absolute; border-radius: 50%; }
.motion-layer { position: absolute; inset: 0; overflow: hidden; }
.motion-fill { position: absolute; inset: 0; display: grid; place-items: center; }
.motion-watermark { position: absolute; pointer-events: none; }
.motion-line { display: inline-block; white-space: pre; will-change: transform, opacity, filter; }
.motion-text { position: absolute; letter-spacing: -0.025em; line-height: 1.1; text-align: center; }
.motion-img { position: absolute; display: block; object-fit: contain; }
`;

export function injectMotionCss(doc: Document): void {
	if (doc.getElementById("motion-css")) return;
	const style = doc.createElement("style");
	style.id = "motion-css";
	style.textContent = MOTION_CSS;
	doc.head.appendChild(style);
}

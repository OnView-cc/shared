/**
 * Medir una pieza en píxeles del cuadro (spec 2026-11-24 §6.5): en la vista
 * previa el escenario va escalado (`scale()` al ancho del visor), así que la
 * caja que da el navegador se divide por esa escala. En la exportación la escala
 * es 1. Así una medida vale igual en la vista previa y en el MP4.
 */
export type Rect = { x: number; y: number; w: number; h: number };

export function unscaledRect(el: Element, stage: Element, frameWidth: number): Rect {
	const s = stage.getBoundingClientRect();
	const r = el.getBoundingClientRect();
	const k = s.width > 0 && frameWidth > 0 ? s.width / frameWidth : 1;
	return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
}

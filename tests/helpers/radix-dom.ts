/**
 * Radix en jsdom: jsdom no trae la captura de puntero, `scrollIntoView` ni
 * `ResizeObserver`, que Radix llama al abrir menús y listas. Esto los simula con
 * lo mínimo; es idempotente (no pisa lo que ya exista) y sin módulos de Node.
 */
export function installRadixDom(): void {
	const proto = Element.prototype as unknown as Record<string, unknown>;
	if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
	if (!proto.setPointerCapture) proto.setPointerCapture = () => undefined;
	if (!proto.releasePointerCapture) proto.releasePointerCapture = () => undefined;
	if (!proto.scrollIntoView) proto.scrollIntoView = () => undefined;
	const g = globalThis as { ResizeObserver?: unknown };
	if (!g.ResizeObserver) {
		g.ResizeObserver = class {
			observe(): void {}
			unobserve(): void {}
			disconnect(): void {}
		};
	}
}

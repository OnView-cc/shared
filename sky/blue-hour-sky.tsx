/**
 * El cielo de la hora azul, pintado en un `<canvas>` 2D: el degradado que pasa
 * del índigo al cobalto, la línea cálida del horizonte que se apaga, estrellas
 * tenues arriba y una silueta baja de ciudad cuyas ventanas se encienden de
 * una en una según avanza `progress` (0 recién puesto el sol, 1 de noche).
 *
 * - Sin `progress` anima una sola vez de 0.35 a 0.8 en 20s y se queda; con
 *   `progress` fijo (un fotograma de la tira) pinta un cuadro y para.
 * - Con `prefers-reduced-motion` pinta el estado final una vez.
 * - Semilla fija: el mismo cielo en cada carga. Redibuja al cambiar de tamaño
 *   (`ResizeObserver`), con `devicePixelRatio` hasta 2.
 * - Decoración (`aria-hidden`); debajo va el cielo de CSS (`.sk-hero-sky`), que
 *   es lo que se ve antes del primer cuadro o si no hay lienzo.
 */
import { useEffect, useRef } from "react";

const SEED = 20261109;
const FROM = 0.35;
const TO = 0.8;
const DURATION_MS = 20_000;

function rng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

interface Building {
	x: number;
	w: number;
	h: number;
	windows: { x: number; y: number; at: number; warm: boolean }[];
}
interface Scene {
	stars: { x: number; y: number; r: number; at: number }[];
	city: Building[];
}

/** La escena en coordenadas relativas (0..1), igual para cualquier tamaño. */
function scene(): Scene {
	const r = rng(SEED);
	const stars = Array.from({ length: 70 }, () => ({ x: r(), y: r() * 0.55, r: 0.4 + r() * 0.9, at: 0.25 + r() * 0.7 }));
	const city: Building[] = [];
	let x = -0.01;
	while (x < 1.01) {
		const w = 0.012 + r() * 0.034;
		const h = 0.2 + r() * 0.8;
		const windows: Building["windows"] = [];
		const cols = Math.max(1, Math.floor(w / 0.007));
		const rows = Math.max(1, Math.floor(h * 6));
		for (let c = 0; c < cols; c++) {
			for (let row = 0; row < rows; row++) {
				if (r() < 0.45) windows.push({ x: (c + 0.5) / cols, y: (row + 0.6) / (rows + 0.4), at: r(), warm: r() < 0.8 });
			}
		}
		city.push({ x, w, h, windows });
		x += w + r() * 0.006;
	}
	return { stars, city };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rgb = (c: [number, number, number]) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, s: Scene, lights: boolean) {
	// el cielo: más oscuro arriba a medida que avanza la hora
	const top = lerp3([18, 36, 96], [6, 11, 30], p);
	const mid = lerp3([38, 68, 158], [22, 44, 120], p);
	const low = lerp3([120, 128, 196], [74, 92, 170], p);
	const sky = ctx.createLinearGradient(0, 0, 0, h);
	sky.addColorStop(0, rgb(top));
	sky.addColorStop(0.55, rgb(mid));
	sky.addColorStop(1, rgb(low));
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, w, h);

	// la línea cálida del horizonte, que se apaga
	const glow = ctx.createRadialGradient(w * 0.5, h * 1.05, 0, w * 0.5, h * 1.05, Math.max(w, h) * 0.75);
	glow.addColorStop(0, `rgba(244,178,106,${mix(0.55, 0.12, p)})`);
	glow.addColorStop(1, "rgba(244,178,106,0)");
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, w, h);

	// estrellas que aparecen
	for (const star of s.stars) {
		const a = Math.max(0, Math.min(1, (p - star.at) * 4));
		if (a <= 0) continue;
		ctx.fillStyle = `rgba(233,236,245,${a * 0.7})`;
		ctx.beginPath();
		ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
		ctx.fill();
	}

	// la ciudad: silueta baja y ventanas que se encienden
	// la ciudad ocupa como mucho un 13 % del alto y nunca más de 120px: es un perfil, no un decorado
	const band = Math.min(h * 0.13, 120);
	const base = h;
	for (const b of s.city) {
		const bx = b.x * w;
		const bw = b.w * w;
		const bh = b.h * band;
		ctx.fillStyle = "#060b19";
		ctx.fillRect(bx, base - bh, bw + 1, bh);
		if (!lights) continue;
		for (const win of b.windows) {
			if (win.at > p) continue;
			ctx.fillStyle = win.warm ? "rgba(242,163,58,0.92)" : "rgba(233,236,245,0.7)";
			ctx.fillRect(bx + win.x * bw - 1, base - bh + win.y * bh - 1, 2, 2.4);
		}
	}
}

function prefersReducedMotion(): boolean {
	return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BlueHourSky({ progress, lights = true, className = "" }: { progress?: number; lights?: boolean; className?: string }) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		const s = scene();
		const fixed = progress !== undefined || prefersReducedMotion();
		const target = progress ?? TO;
		let current = fixed ? target : FROM;
		let start: number | null = null;
		let raf = 0;

		const size = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = canvas.clientWidth || canvas.width || 1;
			const h = canvas.clientHeight || canvas.height || 1;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			return { w, h };
		};
		let dims = size();
		const draw = () => {
			paint(ctx, dims.w, dims.h, current, s, lights);
			canvas.setAttribute("data-ready", "true");
		};
		const tick = (now: number) => {
			if (start === null) start = now;
			const t = Math.min(1, (now - start) / DURATION_MS);
			current = mix(FROM, TO, 1 - (1 - t) ** 3);
			draw();
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(fixed ? draw : tick);

		const observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(() => {
						dims = size();
						draw();
					});
		observer?.observe(canvas);
		return () => {
			cancelAnimationFrame(raf);
			observer?.disconnect();
		};
	}, [progress, lights]);

	return <canvas ref={ref} className={`sk-canvas absolute inset-0 size-full ${className}`} aria-hidden="true" />;
}

/**
 * El tempo de una pista de música y dónde cae su primer golpe (spec 2026-11-18
 * §6, «El tempo en este paso»). El editor la mide al llegar cada pista y guarda
 * `tempo_bpm` y `beat_offset` en el proyecto; todo el video se mide en golpes.
 *
 * Cómo (el método del prototipo, con la fase añadida):
 *   1. La señal, mono y a 11 025 Hz, se parte en ventanas de 512 muestras cada
 *      256 (con ventana de Hann); de cada una, su espectro (FFT) en logaritmo.
 *   2. El «flujo espectral»: cuánto sube cada banda de una ventana a la
 *      siguiente (sólo subidas), sumado. Los golpes son picos de flujo. Se
 *      suaviza un poco. (La energía de banda ancha no basta: en una pista con
 *      platillos el ruido y la música dan lo mismo.)
 *   3. Grueso: el BPM entre 70 y 180 (de 0.5 en 0.5) con la mayor
 *      autocorrelación normalizada del flujo centrado, 1, 2, 3 y 4 golpes
 *      después. Si no llega a `CLARITY`, no hay golpe claro: `null`.
 *   4. Fino: alrededor de ese BPM (de 0.05 en 0.05) y en cada fase, la rejilla de
 *      golpes que cae sobre más flujo en toda la pista. Da el BPM y el primer golpe.
 *
 * Código puro; `samples` es mono. Nunca devuelve `NaN`.
 */

export const TEMPO_MIN = 70;
export const TEMPO_MAX = 180;

const RATE = 11025;
const WIN = 512;
const HOP = 256;
/** Por debajo de esta correlación no hay golpe claro (ruido ≈ 0.03, la pista de Arcade ≈ 0.17, clics ≈ 0.9). */
const CLARITY = 0.08;

function resample(x: Float32Array, rate: number): Float32Array {
	if (rate === RATE) return x;
	const step = rate / RATE;
	const out = new Float32Array(Math.floor(x.length / step));
	for (let j = 0; j < out.length; j++) out[j] = x[Math.floor(j * step)]!;
	return out;
}

function fft(re: Float64Array, im: Float64Array): void {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			[re[i], re[j]] = [re[j]!, re[i]!];
			[im[i], im[j]] = [im[j]!, im[i]!];
		}
	}
	for (let len = 2; len <= n; len <<= 1) {
		const ang = (-2 * Math.PI) / len;
		const half = len / 2;
		for (let i = 0; i < n; i += len) {
			for (let k = 0; k < half; k++) {
				const c = Math.cos(ang * k);
				const sn = Math.sin(ang * k);
				const p = i + k + half;
				const xr = re[p]! * c - im[p]! * sn;
				const xi = re[p]! * sn + im[p]! * c;
				re[p] = re[i + k]! - xr;
				im[p] = im[i + k]! - xi;
				re[i + k] = re[i + k]! + xr;
				im[i + k] = im[i + k]! + xi;
			}
		}
	}
}

const HANN = Float64Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / WIN));

/** El flujo espectral, suavizado: un valor por ventana. */
function onsetFlux(x: Float32Array): Float32Array {
	const frames = Math.max(0, Math.floor((x.length - WIN) / HOP));
	const bins = WIN / 2;
	const flux = new Float32Array(frames);
	const re = new Float64Array(WIN);
	const im = new Float64Array(WIN);
	let prev: Float64Array | null = null;
	for (let i = 0; i < frames; i++) {
		const start = i * HOP;
		for (let j = 0; j < WIN; j++) {
			re[j] = x[start + j]! * HANN[j]!;
			im[j] = 0;
		}
		fft(re, im);
		const mag = new Float64Array(bins);
		for (let k = 1; k < bins; k++) mag[k] = Math.log(1 + 100 * Math.hypot(re[k]!, im[k]!));
		if (prev) {
			let sum = 0;
			for (let k = 1; k < bins; k++) sum += Math.max(0, mag[k]! - prev[k]!);
			flux[i] = sum;
		}
		prev = mag;
	}
	const smooth = new Float32Array(frames);
	for (let i = 0; i < frames; i++) smooth[i] = 0.25 * (flux[i - 1] ?? 0) + 0.5 * flux[i]! + 0.25 * (flux[i + 1] ?? 0);
	return smooth;
}

/** El flujo en una posición fraccionaria (interpolado); 0 fuera. */
function at(f: Float32Array, pos: number): number {
	const i = Math.floor(pos);
	if (i < 0 || i + 1 >= f.length) return 0;
	const w = pos - i;
	return f[i]! * (1 - w) + f[i + 1]! * w;
}

/** El segundo en que suena lo que dispara el flujo de la ventana `i`: en el último salto de esa ventana. */
const frameTime = (i: number) => (i * HOP + WIN - HOP / 2) / RATE;

export function measureTempo(samples: Float32Array, sampleRate: number): { bpm: number; offset: number } | null {
	if (!(sampleRate > 0) || samples.length === 0) return null;
	const f = onsetFlux(resample(samples, sampleRate));
	const fps = RATE / HOP;
	const lagOf = (bpm: number) => (fps * 60) / bpm;
	// Al menos 8 golpes del tempo más lento para poder decir algo.
	if (f.length < lagOf(TEMPO_MIN) * 8) return null;

	// Grueso: la autocorrelación normalizada del flujo centrado, media de 1 a 4 golpes.
	let mean = 0;
	for (const v of f) mean += v;
	mean /= f.length;
	const c = f.map((v) => v - mean);
	let energy = 0;
	for (const v of c) energy += v * v;
	if (!(energy > 0)) return null;
	let best = -Infinity;
	let bestBpm = 0;
	for (let bpm = TEMPO_MIN; bpm <= TEMPO_MAX; bpm += 0.5) {
		const lag = lagOf(bpm);
		let s = 0;
		let n = 0;
		for (let i = 0; i + 4 * lag < c.length; i++, n++) s += (c[i]! * (at(c, i + lag) + at(c, i + 2 * lag) + at(c, i + 3 * lag) + at(c, i + 4 * lag))) / 4;
		const r = n > 0 ? ((s / energy) * c.length) / n : 0;
		if (r > best) {
			best = r;
			bestBpm = bpm;
		}
	}
	if (!(best >= CLARITY)) return null;

	// Fino: BPM y fase de la rejilla que más flujo recoge en toda la pista.
	let fine = -1;
	let fineBpm = bestBpm;
	let finePhase = 0;
	for (let bpm = bestBpm - 0.75; bpm <= bestBpm + 0.75 + 1e-9; bpm += 0.05) {
		const lag = lagOf(bpm);
		for (let phase = 0; phase < lag; phase += 0.25) {
			let s = 0;
			for (let pos = phase; pos < f.length; pos += lag) s += at(f, pos);
			if (s > fine) {
				fine = s;
				fineBpm = bpm;
				finePhase = phase;
			}
		}
	}
	const bpm = Math.round(fineBpm * 100) / 100;
	if (bpm < TEMPO_MIN || bpm > TEMPO_MAX || !Number.isFinite(bpm)) return null;
	const period = 60 / bpm;
	let offset = frameTime(finePhase) % period;
	if (offset < 0) offset += period;
	offset = Math.round(offset * 1000) / 1000;
	return Number.isFinite(offset) ? { bpm, offset } : null;
}

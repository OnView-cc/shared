import { describe, expect, it } from "vitest";
import { measureTempo } from "./tempo";

/** Números pseudoaleatorios con semilla (mulberry32): la prueba es siempre la misma. */
function rng(seed: number): () => number {
	let a = seed | 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Ruido suave con un clic de 10 ms en cada golpe. */
function clicks(bpm: number, offset: number, seconds: number, sampleRate: number): Float32Array {
	const out = new Float32Array(Math.round(seconds * sampleRate));
	const rand = rng(7);
	for (let i = 0; i < out.length; i++) out[i] = (rand() * 2 - 1) * 0.01;
	const click = Math.round(0.01 * sampleRate);
	for (let t = offset; t < seconds; t += 60 / bpm) {
		const start = Math.round(t * sampleRate);
		for (let j = 0; j < click && start + j < out.length; j++) out[start + j] += Math.sin(j * 0.6) * (1 - j / click) * 0.8;
	}
	return out;
}

function noise(seconds: number, sampleRate: number): Float32Array {
	const out = new Float32Array(Math.round(seconds * sampleRate));
	const rand = rng(3);
	for (let i = 0; i < out.length; i++) out[i] = (rand() * 2 - 1) * 0.3;
	return out;
}

describe("measureTempo", () => {
	it("finds 116 BPM and its first beat", () => {
		const t0 = performance.now();
		const r = measureTempo(clicks(116, 0.3, 20, 11025), 11025)!;
		expect(performance.now() - t0).toBeLessThan(300);
		expect(Math.abs(r.bpm - 116)).toBeLessThanOrEqual(0.5);
		expect(Math.abs(r.offset - 0.3)).toBeLessThanOrEqual(0.02);
	});

	it("finds 90 and 128 BPM", () => {
		expect(Math.abs(measureTempo(clicks(90, 0.1, 20, 11025), 11025)!.bpm - 90)).toBeLessThanOrEqual(0.5);
		expect(Math.abs(measureTempo(clicks(128, 0.2, 20, 11025), 11025)!.bpm - 128)).toBeLessThanOrEqual(0.5);
	});

	it("resamples a 48 kHz track", () => {
		const r = measureTempo(clicks(116, 0.25, 12, 48000), 48000)!;
		expect(Math.abs(r.bpm - 116)).toBeLessThanOrEqual(0.5);
		expect(Math.abs(r.offset - 0.25)).toBeLessThanOrEqual(0.02);
	});

	it("returns null for steady noise", () => {
		expect(measureTempo(noise(20, 11025), 11025)).toBeNull();
	});

	it("returns null for silence", () => {
		expect(measureTempo(new Float32Array(11025 * 10), 11025)).toBeNull();
	});

	it("returns null for a track too short to tell", () => {
		expect(measureTempo(clicks(116, 0, 1, 11025), 11025)).toBeNull();
	});
});

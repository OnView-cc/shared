/**
 * Los tests del paquete: los de Node por defecto, y jsdom en los que lo piden
 * con su comentario de cabecera (`// @vitest-environment jsdom`). Los .tsx se
 * compilan con el runtime automático de JSX, como en las apps que lo consumen.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: { jsx: "automatic" },
	test: {
		include: ["tests/**/*.test.ts", "lib/**/*.test.ts", "video/**/*.test.ts", "motion/**/*.test.ts", "motion/**/*.test.tsx", "ventana/**/*.test.ts", "ventana/**/*.test.tsx"],
		environment: "node",
	},
});

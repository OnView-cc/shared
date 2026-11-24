// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost:5401/"}
/** En local, una consola habla con el `wrangler pages dev` de onview (puerto 8900). */
import { describe, expect, it } from "vitest";
import { platformOrigin } from "./platform-client";

describe("platformOrigin en local", () => {
	it("is the onview dev server on localhost", () => {
		expect(platformOrigin()).toBe("http://localhost:8900");
	});
});

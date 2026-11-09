// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://admin.arcade.lat/apps"}
/** Sin `VITE_PLATFORM_ORIGIN`, una consola en un subdominio habla con el apex de producción. */
import { describe, expect, it } from "vitest";
import { platformOrigin } from "../lib/platform-client";

describe("platformOrigin", () => {
	it("is arcade.lat from a console subdomain", () => {
		expect(platformOrigin()).toBe("https://arcade.lat");
	});
});

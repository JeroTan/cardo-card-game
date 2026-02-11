import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	test: {
		// Default to node environment, but allow per-file overrides with @vitest-environment comment
		environment: 'node',
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});

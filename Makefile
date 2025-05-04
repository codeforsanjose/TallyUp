build-loginFunction:
	bun build ./src/loginFunction.ts --outdir=$(ARTIFACTS_DIR) --sourcemap=linked --target=node --entry-naming=loginFunction.mjs

build-registerFunction:
	bun build ./src/registerFunction.ts --outdir=$(ARTIFACTS_DIR) --sourcemap=linked --target=node --entry-naming=registerFunction.mjs
	
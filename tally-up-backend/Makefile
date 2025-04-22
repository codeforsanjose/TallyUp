build-homeFunction:
	bun build ./src/homeFunction.ts --outdir=$(ARTIFACTS_DIR) --sourcemap=linked --target=node --entry-naming=homeFunction.mjs
	cp ./dist/index.html $(ARTIFACTS_DIR)/index.html

build-staticServeFunction:
	bun build ./src/staticServeFunction.ts --outdir=$(ARTIFACTS_DIR) --sourcemap=linked --target=node --entry-naming=staticServeFunction.mjs
	cp ./dist/main.js $(ARTIFACTS_DIR)/main.js
build-homeFunction:
	bun build ./src/homeFunction.ts --outdir=$(ARTIFACTS_DIR) --sourcemap=linked --target=node --entry-naming=homeFunction.mjs
	cp ./index.html $(ARTIFACTS_DIR)/index.html

build-pageContentFunction:
	bun build ./src/pageContentFunction.ts --outdir=$(ARTIFACTS_DIR) --sourcemap=linked --target=node --entry-naming=pageContentFunction.mjs
	
import Bun, { Glob } from "bun";

const handlerGlobs = new Glob("*.ts");

const handlers = handlerGlobs.scanSync({
  absolute: true,
  onlyFiles: true,
  cwd: "./src/handlers/",
});

await Bun.build({
  entrypoints: Array.from(handlers),
  outdir: "./build/",
  splitting: true,
  minify: true,
  target: "bun",
  sourcemap: "linked" // TODO: Delete this line in production
});
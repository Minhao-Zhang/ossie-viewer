# Ossie viewer

Ossie viewer opens an [Apache Ossie](https://github.com/apache/ossie) semantic model in the browser and shows it whole: its datasets and the relationships between them, each dataset's fields, the metrics and what they reference, the AI context at every level, and any vendor extensions. It has no backend. The file never leaves your machine.

Open a YAML or JSON file from the file picker, from a URL (the field on the page, or `?file=<url>`), or by dropping it on the page. The viewer checks the document against the Ossie schema for its `version` (`0.2.0.dev0` or `0.1.1`; see `src/schemas/README.md`) and draws each dataset, with a relationship as an edge from the many side to the one side. Fields and metrics come next.

## Run it

You need Node 22.12 or newer.

```bash
npm ci
npm run dev
```

`npm run build` writes one self-contained `dist/index.html`, which you can open straight from disk with no server.

## Checks

`npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` run in CI on every push and pull request.

## License

Apache License 2.0. See [LICENSE](LICENSE).

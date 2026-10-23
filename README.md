# Ossie viewer

Ossie viewer opens an [Apache Ossie](https://github.com/apache/ossie) semantic model in the browser and shows it whole: its datasets and the relationships between them, each dataset's fields, the metrics and what they reference, the AI context at every level, and any vendor extensions. It has no backend. The file never leaves your machine.

It is being built in steps. This first version is an empty page with its checks in place; opening a file comes next.

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

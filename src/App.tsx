import { useCallback, useEffect, useRef, useState } from "react";

import { Detail } from "./Detail";
import { openText, type OpenedDocument } from "./document";
import { fetchText } from "./fetchText";
import { GraphView } from "./GraphView";
import { linkToCopy, readLocationHash, resolveHash, sameTarget, selectionHash, writeLocationHash } from "./hash";
import { ModelIndex, ModelSummary } from "./Overview";
import type { Selection } from "./selection";

export function App() {
  const [source, setSource] = useState<string | null>(null);
  const [url, setUrl] = useState(
    () => new URLSearchParams(window.location.search).get("file") ?? "",
  );
  const [fileUrl, setFileUrl] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get("file"),
  );
  const [opened, setOpened] = useState<OpenedDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locationHash, setLocationHash] = useState(readLocationHash);
  const request = useRef(0);

  const show = useCallback((text: string, label: string) => {
    request.current += 1;
    setSource(label);
    setFileUrl(null);
    setLoadError(null);
    setOpened(openText(text));
  }, []);

  const openFile = useCallback(
    async (file: File) => {
      try {
        show(await file.text(), file.name);
      } catch {
        request.current += 1;
        setSource(file.name);
        setFileUrl(null);
        setOpened(null);
        setLoadError(`Could not read ${file.name}.`);
      }
    },
    [show],
  );

  const loadUrl = useCallback(async (next: string) => {
    const id = ++request.current;
    setSource(next);
    setFileUrl(next);
    setLoadError(null);
    setOpened(null);
    const page = new URL(window.location.href);
    page.searchParams.set("file", next);
    window.history.replaceState(null, "", `${page.pathname}${page.search}${page.hash}`);
    const result = await fetchText(next);
    if (id !== request.current) return;
    if ("error" in result) {
      setLoadError(result.error);
      return;
    }
    setOpened(openText(result.text));
  }, []);

  useEffect(() => {
    // State is updated in the callback. Calling loadUrl from this effect would set state synchronously, which the lint rule rejects.
    const fromPage = new URLSearchParams(window.location.search).get("file");
    if (!fromPage) return;
    const id = ++request.current;
    let cancelled = false;
    void fetchText(fromPage).then((result) => {
      if (cancelled || id !== request.current) return;
      setSource(fromPage);
      setFileUrl(fromPage);
      if ("error" in result) {
        setOpened(null);
        setLoadError(result.error);
        return;
      }
      setLoadError(null);
      setOpened(openText(result.text));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onHashChange() {
      setLocationHash(readLocationHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const choose = useCallback((next: Selection | null) => {
    const hash = next ? selectionHash(next) : "";
    if (!sameTarget(readLocationHash(), next)) writeLocationHash(hash);
    setLocationHash(readLocationHash());
  }, []);

  useEffect(() => {
    function onDragOver(event: DragEvent) {
      const types = event.dataTransfer?.types;
      if (!types || !Array.from(types).includes("Files")) return;
      event.preventDefault();
    }
    function onDrop(event: DragEvent) {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      event.preventDefault();
      void openFile(file);
    }
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [openFile]);

  const ready = opened !== null && opened.parseError === null ? opened : null;
  const located = ready ? resolveHash(ready.model, locationHash) : { selection: null, notFound: null };
  const showOverview = ready !== null && located.selection === null;

  return (
    <main>
      <div className="page">
        <h1>Ossie viewer</h1>
        <p className="muted">Open a YAML or JSON semantic model. Drop a file anywhere on this page.</p>
        <div className="open">
          <label>
            Open a file
            <input
              type="file"
              accept=".yaml,.yml,.json,application/json,text/yaml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void openFile(file);
              }}
            />
          </label>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const next = url.trim();
              if (!next) {
                setLoadError("Enter a URL to open.");
                return;
              }
              void loadUrl(next);
            }}
          >
            <label>
              URL
              <input
                type="text"
                name="url"
                value={url}
                placeholder="https://example.com/model.yaml"
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
            <button type="submit">Open</button>
          </form>
        </div>

        {source ? <p>{source}</p> : null}
        {opened?.version ? <p>{`Version ${opened.version}`}</p> : null}
        {loadError ? <p>{loadError}</p> : null}
        {opened?.parseError ? <p>{opened.parseError}</p> : null}
        {opened && !opened.parseError && opened.issues.length === 0 ? <p>No validation errors.</p> : null}
        {opened && opened.issues.length > 0 ? (
          <ul aria-label="Validation errors">
            {opened.issues.map((issue) => (
              <li key={`${issue.path}\0${issue.message}`}>
                <code>{issue.path}</code> {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
        {showOverview && ready ? (
          <>
            {located.notFound ? <p>{`"${located.notFound}" is not found in this file.`}</p> : null}
            <ModelSummary model={ready.model} />
          </>
        ) : null}
        {ready && located.selection ? (
          <Detail
            model={ready.model}
            selection={located.selection}
            copy={linkToCopy(located.selection, fileUrl)}
            onSelect={choose}
            onBack={() => choose(null)}
          />
        ) : null}
      </div>
      {showOverview && ready && ready.graph.nodes.length > 0 ? (
        <GraphView
          graph={ready.graph}
          selected={null}
          onSelect={(name) => choose({ kind: "dataset", name })}
        />
      ) : null}
      {showOverview && ready ? (
        <div className="page">
          <ModelIndex model={ready.model} onSelect={choose} />
        </div>
      ) : null}
    </main>
  );
}

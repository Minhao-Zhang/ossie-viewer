import { useEffect } from "react";

import { AiContextView, hasAiContext } from "./AiContextView";
import { ExtensionsView } from "./ExtensionsView";
import { LinkButton } from "./LinkButton";
import type { Dataset, DialectExpression, Relationship } from "./model";
import type { Selection } from "./selection";

type Props = {
  dataset: Dataset;
  relationships: Relationship[];
  highlight: string | null;
  onSelect: (selection: Selection) => void;
};

function ExpressionText({ expressions }: { expressions: DialectExpression[] }) {
  if (expressions.length === 0) return null;
  if (expressions.length === 1) return <code>{expressions[0].expression}</code>;
  return (
    <>
      {expressions.map((item, index) => (
        <div key={`${item.dialect}-${index}`}>
          <span className="muted">{item.dialect} </span>
          <code>{item.expression}</code>
        </div>
      ))}
    </>
  );
}

export function DatasetView({ dataset, relationships, highlight, onSelect }: Props) {
  const involved = relationships.filter((item) => item.from === dataset.name || item.to === dataset.name);
  const fieldKnown = highlight !== null && dataset.fields.some((field) => field.name === highlight);
  const showType = dataset.fields.some((field) => field.datatype);
  const showContext = dataset.fields.some((field) => hasAiContext(field.aiContext));
  const showExtensions = dataset.fields.some((field) => field.extensions.length > 0);

  useEffect(() => {
    if (!highlight) return;
    const row = document.querySelector("tr[aria-current='true']");
    if (row && typeof row.scrollIntoView === "function") row.scrollIntoView({ block: "nearest" });
  }, [highlight, dataset.name]);

  return (
    <article>
      <h2>{dataset.name}</h2>
      {dataset.description ? <p>{dataset.description}</p> : null}
      <dl className="facts">
        {dataset.source ? (
          <div>
            <dt>Source</dt>
            <dd>{dataset.source}</dd>
          </div>
        ) : null}
        {dataset.primaryKey.length > 0 ? (
          <div>
            <dt>Primary key</dt>
            <dd>{dataset.primaryKey.join(", ")}</dd>
          </div>
        ) : null}
        {dataset.uniqueKeys.length > 0 ? (
          <div>
            <dt>Unique keys</dt>
            <dd>
              {dataset.uniqueKeys.map((key, index) => (
                <div key={index}>{key.join(", ")}</div>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
      {hasAiContext(dataset.aiContext) ? (
        <>
          <h3>AI context</h3>
          <AiContextView value={dataset.aiContext} />
        </>
      ) : null}
      {dataset.extensions.length > 0 ? (
        <>
          <h3>Extensions</h3>
          <ExtensionsView extensions={dataset.extensions} />
        </>
      ) : null}
      <h3>Fields</h3>
      {dataset.fields.length === 0 ? <p className="muted">No fields.</p> : null}
      {highlight && !fieldKnown ? <p>This field is not in this dataset.</p> : null}
      {dataset.fields.length > 0 ? (
        <table aria-label="Fields">
          <thead>
            <tr>
              <th>Name</th>
              <th>Expression</th>
              {showType ? <th>Type</th> : null}
              <th>Description</th>
              {showContext ? <th>AI context</th> : null}
              {showExtensions ? <th>Extensions</th> : null}
            </tr>
          </thead>
          <tbody>
            {dataset.fields.map((field) => (
              <tr key={field.name} aria-current={field.name === highlight ? "true" : undefined}>
                <td>{field.name}</td>
                <td>
                  <ExpressionText expressions={field.expressions} />
                </td>
                {showType ? <td>{field.datatype}</td> : null}
                <td>{field.description}</td>
                {showContext ? (
                  <td>
                    <AiContextView value={field.aiContext} />
                  </td>
                ) : null}
                {showExtensions ? (
                  <td>
                    <ExtensionsView extensions={field.extensions} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {involved.length > 0 ? (
        <>
          <h3>Relationships</h3>
          <ul>
            {involved.map((relationship, index) => {
              const other = relationship.from === dataset.name ? relationship.to : relationship.from;
              const direction = relationship.from === dataset.name ? "to" : "from";
              const columns =
                relationship.fromColumns.length > 0 || relationship.toColumns.length > 0
                  ? `${relationship.fromColumns.join(", ")} to ${relationship.toColumns.join(", ")}`
                  : null;
              return (
                <li key={`${relationship.name}-${index}`}>
                  {relationship.name} {direction}{" "}
                  <LinkButton onClick={() => onSelect({ kind: "dataset", name: other })}>{other}</LinkButton>
                  {columns ? <span className="muted"> {columns}</span> : null}
                  <AiContextView value={relationship.aiContext} />
                  <ExtensionsView extensions={relationship.extensions} />
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </article>
  );
}

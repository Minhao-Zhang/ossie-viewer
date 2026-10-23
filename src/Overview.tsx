import { AiContextView, hasAiContext } from "./AiContextView";
import { ExtensionsView } from "./ExtensionsView";
import { LinkButton } from "./LinkButton";
import type { SemanticModel } from "./model";
import type { Selection } from "./selection";

function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function modelCounts(model: SemanticModel): string {
  return [
    count(model.datasets.length, "dataset", "datasets"),
    count(model.relationships.length, "relationship", "relationships"),
    count(model.metrics.length, "metric", "metrics"),
  ].join(", ");
}

export function ModelSummary({ model }: { model: SemanticModel }) {
  return (
    <>
      {model.name ? <h2>{model.name}</h2> : null}
      {model.description ? <p>{model.description}</p> : null}
      {hasAiContext(model.aiContext) ? (
        <>
          <h3>AI context</h3>
          <AiContextView value={model.aiContext} />
        </>
      ) : null}
      {model.extensions.length > 0 ? (
        <>
          <h3>Extensions</h3>
          <ExtensionsView extensions={model.extensions} />
        </>
      ) : null}
      <p className="muted">{`${modelCounts(model)}.`}</p>
      {model.datasets.length === 0 ? <p className="muted">No datasets to draw.</p> : null}
    </>
  );
}

export function ModelIndex({ model, onSelect }: { model: SemanticModel; onSelect: (selection: Selection) => void }) {
  return (
    <>
      <h2>Datasets</h2>
      {model.datasets.length === 0 ? <p className="muted">None.</p> : null}
      {model.datasets.length > 0 ? (
        <ul>
          {model.datasets.map((dataset, index) => (
            <li key={`${dataset.name}-${index}`}>
              <LinkButton onClick={() => onSelect({ kind: "dataset", name: dataset.name })}>{dataset.name}</LinkButton>
            </li>
          ))}
        </ul>
      ) : null}
      <h2>Metrics</h2>
      {model.metrics.length === 0 ? <p className="muted">None.</p> : null}
      {model.metrics.length > 0 ? (
        <ul>
          {model.metrics.map((metric, index) => (
            <li key={`${metric.name}-${index}`}>
              <LinkButton onClick={() => onSelect({ kind: "metric", name: metric.name })}>{metric.name}</LinkButton>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

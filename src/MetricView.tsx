import { AiContextView, hasAiContext } from "./AiContextView";
import { ExtensionsView } from "./ExtensionsView";
import { LinkButton } from "./LinkButton";
import type { Metric } from "./model";
import type { Selection } from "./selection";

type Props = {
  metric: Metric;
  onSelect: (selection: Selection) => void;
};

export function MetricView({ metric, onSelect }: Props) {
  return (
    <article>
      <h2>{metric.name}</h2>
      {metric.description ? <p>{metric.description}</p> : null}
      <h3>Expression</h3>
      {metric.expressions.length === 0 ? <p className="muted">None.</p> : null}
      {metric.expressions.map((item, index) => (
        <div key={`${item.dialect}-${index}`}>
          <p className="muted">{item.dialect}</p>
          <pre>{item.expression}</pre>
        </div>
      ))}
      {hasAiContext(metric.aiContext) ? (
        <>
          <h3>AI context</h3>
          <AiContextView value={metric.aiContext} />
        </>
      ) : null}
      {metric.extensions.length > 0 ? (
        <>
          <h3>Extensions</h3>
          <ExtensionsView extensions={metric.extensions} />
        </>
      ) : null}
      <h3>References</h3>
      {metric.references.length === 0 ? <p className="muted">None.</p> : null}
      {metric.references.length > 0 ? (
        <ul>
          {metric.references.map((ref) => (
            <li key={`${ref.dataset}.${ref.field}`}>
              <LinkButton onClick={() => onSelect({ kind: "field", dataset: ref.dataset, name: ref.field })}>
                {`${ref.dataset}.${ref.field}`}
              </LinkButton>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

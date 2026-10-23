import { CopyLink } from "./CopyLink";
import { DatasetView } from "./DatasetView";
import type { CopiedLink } from "./hash";
import { LinkButton } from "./LinkButton";
import { MetricView } from "./MetricView";
import type { SemanticModel } from "./model";
import type { Selection } from "./selection";

type Props = {
  model: SemanticModel;
  selection: Selection;
  copy: CopiedLink;
  onSelect: (selection: Selection) => void;
  onBack: () => void;
};

export function Detail({ model, selection, copy, onSelect, onBack }: Props) {
  const datasetName = selection.kind === "field" ? selection.dataset : selection.kind === "dataset" ? selection.name : null;
  const dataset = datasetName === null ? null : model.datasets.find((item) => item.name === datasetName) ?? null;
  const metric = selection.kind === "metric" ? model.metrics.find((item) => item.name === selection.name) ?? null : null;
  const missing = selection.kind === "metric" ? metric === null : dataset === null;

  return (
    <div className="detail">
      <p>
        <LinkButton onClick={onBack}>Back</LinkButton>
      </p>
      {missing ? <p>Not found in this file.</p> : <CopyLink key={copy.text} text={copy.text} local={copy.local} />}
      {metric ? <MetricView metric={metric} onSelect={onSelect} /> : null}
      {dataset ? (
        <DatasetView
          dataset={dataset}
          relationships={model.relationships}
          metrics={model.metrics}
          highlight={selection.kind === "field" ? selection.name : null}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}

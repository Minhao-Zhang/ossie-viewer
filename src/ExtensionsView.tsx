import { jsonText } from "./jsonText";
import type { Extension } from "./model";

export function ExtensionsView({ extensions }: { extensions: Extension[] }) {
  if (extensions.length === 0) return null;
  return (
    <>
      {extensions.map((extension, index) => (
        <div className="extension" key={`${extension.vendor}-${index}`}>
          <p>{extension.vendor}</p>
          {extension.kind === "text" ? <p className="muted">{extension.note}</p> : null}
          {extension.kind === "json" ? (
            <pre>{jsonText(extension.value) ?? "This value could not be shown as JSON."}</pre>
          ) : (
            <pre>{extension.text}</pre>
          )}
        </div>
      ))}
    </>
  );
}

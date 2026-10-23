import { useState } from "react";

type Props = {
  text: string;
  local: boolean;
};

const LOCAL_NOTE = "Copied the hash only. A link cannot reopen a local file.";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // file:// pages often reject the async clipboard.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function CopyLink({ text, local }: Props) {
  const [note, setNote] = useState<string | null>(null);

  return (
    <>
      <p>
        <button
          type="button"
          className="link"
          onClick={() => {
            void writeClipboard(text).then((ok) => {
              if (!ok) {
                setNote("Could not copy the link.");
                return;
              }
              setNote(local ? LOCAL_NOTE : null);
            });
          }}
        >
          Copy link
        </button>
      </p>
      {note ? <p className="muted">{note}</p> : null}
    </>
  );
}

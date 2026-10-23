import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick: () => void;
};

export function LinkButton({ children, onClick }: Props) {
  return (
    <button type="button" className="link" onClick={onClick}>
      {children}
    </button>
  );
}

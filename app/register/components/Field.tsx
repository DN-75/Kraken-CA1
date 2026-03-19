import type { ReactNode } from "react";
import { FIELD_ICON, FIELD_LABEL } from "./registerUiStyles";

interface FieldProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}

export function Field({ label, icon, children }: FieldProps) {
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <div className="relative">
        <span className={FIELD_ICON}>{icon}</span>
        {children}
      </div>
    </div>
  );
}


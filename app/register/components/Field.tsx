import type { ReactNode } from "react";
import { FIELD_ICON, FIELD_LABEL } from "./registerUiStyles";

interface FieldProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  required?: boolean;
}

export function Field({ label, icon, children, required = false }: FieldProps) {
  return (
    <div>
      <label className={FIELD_LABEL}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-red-400">
              *
            </span>
            <span className="sr-only">required</span>
          </>
        )}
      </label>
      <div className="relative">
        <span className={FIELD_ICON}>{icon}</span>
        {children}
      </div>
    </div>
  );
}


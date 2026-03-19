import { KICKER, PROGRESS_BAR_BASE, PROGRESS_TRACK, STEP_TEXT } from "./registerUiStyles";

interface StepHeaderProps {
  title: string;
  step: number;
  totalSteps: number;
  progressPct: number;
}

export function StepHeader({ title, step, totalSteps, progressPct }: StepHeaderProps) {
  return (
    <div className="mb-2 flex items-start justify-between">
      <div>
        <p className={KICKER}>Registration</p>
        <h1 className="m-0 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
      </div>
      <div className="mt-1 flex shrink-0 flex-col items-end gap-1.5">
        <p className={STEP_TEXT}>
          Step {step} of {totalSteps}
        </p>
        <div className={PROGRESS_TRACK}>
          <div className={PROGRESS_BAR_BASE} style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
}


import { IoEyeOffOutline, IoEyeOutline, IoLockClosedOutline } from "react-icons/io5";
import { Field } from "./Field";
import { ROUND_INPUT } from "./registerUiStyles";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}

export function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder = "Enter password",
}: PasswordFieldProps) {
  return (
    <Field label={label} icon={<IoLockClosedOutline size={18} />}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ROUND_INPUT + " pr-11"}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent p-0 text-[#649c8c]"
      >
        {show ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
      </button>
    </Field>
  );
}


interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={`toggle-switch${disabled ? ' toggle-switch-disabled' : ''}`} aria-label={label}>
      <input
        type="checkbox"
        className="toggle-input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" />
    </label>
  );
}

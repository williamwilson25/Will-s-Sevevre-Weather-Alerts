interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function ToggleSwitch({ checked, onChange, label }: Props) {
  return (
    <label className="toggle-switch" aria-label={label}>
      <input
        type="checkbox"
        className="toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" />
    </label>
  );
}

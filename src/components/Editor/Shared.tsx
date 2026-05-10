export const TextInput = ({ label, value, onChange, placeholder, readOnly }: { label: string, value: string, onChange?: (val: string) => void, placeholder?: string, readOnly?: boolean }) => (
  <div className="form-group">
    <label>{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={e => onChange?.(e.target.value)} 
      placeholder={placeholder} 
      readOnly={readOnly} 
    />
  </div>
);

export const Checkbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <label>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> {label}
  </label>
);

export const TextArea = ({ label, value, onChange, rows = 3, className = '' }: { label: string, value: string, onChange: (val: string) => void, rows?: number, className?: string }) => (
  <div className={`form-group ${className}`}>
    <label>{label}</label>
    <textarea 
      rows={rows}
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
);

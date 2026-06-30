import { Link } from "react-router-dom";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}

export default function DataConsentCheckbox({ checked, onChange, id = "data-consent" }: Props) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
        required
      />
      <span>
        He leído y acepto la{" "}
        <Link to="/politica-datos" target="_blank" className="underline text-primary hover:opacity-80">
          Política de Tratamiento de Datos Personales
        </Link>{" "}
        de Netpower IT SAS.
      </span>
    </label>
  );
}

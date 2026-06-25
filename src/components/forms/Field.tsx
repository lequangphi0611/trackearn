import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  id?: string;
};

/**
 * Một trường nhập của form: Label + Input + (hint) + lỗi inline.
 * Dùng chung cho các form auth/settings.
 */
export function Field({ label, name, error, hint, id, ...inputProps }: FieldProps) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} aria-invalid={Boolean(error)} {...inputProps} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

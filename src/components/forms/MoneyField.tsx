import { useId } from "react";

import { InputMoney, type InputMoneyProps } from "@/components/forms/InputMoney";
import { Label } from "@/components/ui/label";

type MoneyFieldProps = Omit<InputMoneyProps, "id" | "aria-invalid"> & {
  label: string;
  error?: string;
  hint?: string;
  id?: string;
};

/**
 * Một trường nhập tiền: Label + InputMoney + (hint) + lỗi inline — bản
 * tương đương Field.tsx cho InputMoney (không thể dùng Field trực tiếp vì
 * InputMoney có API value/onChange kiểu number, khác Input thô). Label là
 * sibling (gắn qua htmlFor/id, không bọc quanh InputMoney) để accessible
 * name của input chỉ tính từ text label, không kéo theo chip ×1000/₫.
 */
export const MoneyField = ({ label, error, hint, id, ...inputMoneyProps }: MoneyFieldProps) => {
  const autoId = useId();
  const fieldId = id ?? inputMoneyProps.name ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <InputMoney id={fieldId} aria-invalid={Boolean(error)} {...inputMoneyProps} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, vndFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";

type InputMoneyProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  /** Cho phép gõ dấu "-". Mặc định false — 3 use case hiện tại (doanh thu, chi phí, giá vốn) đều không âm. */
  allowNegative?: boolean;
  /** Chỉ dấu (âm/dương) ảnh hưởng tới allowNegative hiệu lực — không chặn cứng giá trị khi gõ. */
  min?: number;
  max?: number;
  className?: string;
};

function digitsFromNumber(n: number | undefined): string {
  if (n === undefined) return "";
  return String(Math.trunc(n));
}

function normalizeLeadingZeros(s: string): string {
  const neg = s.startsWith("-");
  const digits = (neg ? s.slice(1) : s).replace(/^0+(?=\d)/, "");
  return neg ? (digits === "" ? "-" : `-${digits}`) : digits;
}

function parseSignAndDigits(s: string): number | undefined {
  if (s === "" || s === "-") return undefined;
  return Number(s);
}

function formatDisplay(signAndDigits: string): string {
  if (signAndDigits === "" || signAndDigits === "-") return signAndDigits;
  return vndFormatter.format(Number(signAndDigits));
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function countDigitsBeforeCursor(str: string, cursor: number): number {
  let count = 0;
  for (let i = 0; i < cursor && i < str.length; i++) {
    if (isDigit(str[i])) count++;
  }
  return count;
}

function countAllDigits(str: string): number {
  return countDigitsBeforeCursor(str, str.length);
}

// Vị trí trả về luôn ngay SAU một ký tự digit (không bao giờ ngay sau dấu
// chấm phân cách) — nhờ vậy Backspace luôn xoá đúng 1 chữ số, không xoá
// nhầm dấu chấm tự động chèn.
function cursorPosForDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return formatted.startsWith("-") ? 1 : 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (isDigit(formatted[i])) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return formatted.length;
}

function removeDigitAt(digitsOnly: string, index: number): string {
  if (index < 0 || index >= digitsOnly.length) return digitsOnly;
  return digitsOnly.slice(0, index) + digitsOnly.slice(index + 1);
}

/**
 * Input tiền VND dùng chung — auto-format dấu chấm phân nghìn (vi-VN) khi gõ,
 * giữ vị trí con trỏ tương đối theo số chữ số (không nhảy về cuối) khi sửa
 * giữa số, kèm chip ×1000 cho thao tác gõ tắt trên mobile. Khi có `name`,
 * component tự render input ẩn mang giá trị số thật để native form submit
 * (Server Action) không nhận nhầm chuỗi đã format.
 */
export const InputMoney = ({
  value,
  onChange,
  placeholder = "0",
  disabled,
  name,
  required,
  allowNegative = false,
  min,
  max,
  className,
}: InputMoneyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const [raw, setRaw] = useState(() => digitsFromNumber(value));
  const [prevValueProp, setPrevValueProp] = useState(value);
  // `lastEmitted`/`lastDigitCount` dùng state (không phải ref) vì cần đọc/ghi
  // ngay trong thân render (nhánh đồng bộ dưới đây) — refs không được phép
  // truy cập lúc render (react-hooks/refs).
  const [lastEmitted, setLastEmitted] = useState(value);
  const [lastDigitCount, setLastDigitCount] = useState(() => countAllDigits(raw));

  // Đồng bộ lại `raw` khi `value` đổi từ bên ngoài (không phải do chính
  // component vừa emit) — theo pattern "adjust state during render" của
  // React, không cần useEffect.
  if (value !== prevValueProp) {
    setPrevValueProp(value);
    if (value !== lastEmitted) {
      const next = digitsFromNumber(value);
      setRaw(next);
      setLastDigitCount(countAllDigits(next));
    }
  }

  const effectiveAllowNegative = allowNegative && (min === undefined || min < 0);
  const display = formatDisplay(raw);

  useLayoutEffect(() => {
    if (pendingCursorRef.current === null) return;
    const pos = cursorPosForDigitCount(display, pendingCursorRef.current);
    inputRef.current?.setSelectionRange(pos, pos);
    pendingCursorRef.current = null;
  }, [display]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const domValue = el.value;
    const cursor = el.selectionStart ?? domValue.length;
    const digitsBeforeCursor = countDigitsBeforeCursor(domValue, cursor);

    let signAndDigits = "";
    for (const ch of domValue) {
      if ((ch === "-" || ch === "−") && effectiveAllowNegative && signAndDigits === "") {
        signAndDigits = "-";
      } else if (isDigit(ch)) {
        signAndDigits += ch;
      }
    }
    signAndDigits = normalizeLeadingZeros(signAndDigits);
    const candidate = parseSignAndDigits(signAndDigits);

    if (candidate !== undefined && Math.abs(candidate) > Number.MAX_SAFE_INTEGER) {
      // Chặn cứng bằng cách revert thẳng DOM: nếu `raw` không đổi, React bỏ
      // qua re-render (Object.is check) và sẽ để lại ký tự vừa gõ (bị từ
      // chối) trong DOM nếu không tự tay set lại `el.value`.
      el.value = display;
      const pos = cursorPosForDigitCount(display, lastDigitCount);
      el.setSelectionRange(pos, pos);
      return;
    }

    pendingCursorRef.current = digitsBeforeCursor;
    setLastDigitCount(digitsBeforeCursor);
    setLastEmitted(candidate);
    setRaw(signAndDigits);
    onChange(candidate);
  }

  function commit(nextRaw: string, digitCursorCount: number) {
    const normalized = normalizeLeadingZeros(nextRaw);
    const candidate = parseSignAndDigits(normalized);
    pendingCursorRef.current = digitCursorCount;
    setLastDigitCount(digitCursorCount);
    setLastEmitted(candidate);
    setRaw(normalized);
    onChange(candidate);
  }

  // Backspace/Delete tự xử lý thay vì để trình duyệt xoá ký tự thô: nếu ký tự
  // ngay cạnh cursor là dấu chấm phân cách (không phải digit), Backspace/Delete
  // mặc định của trình duyệt sẽ xoá dấu chấm đó rồi không đổi gì (dấu chấm được
  // chèn lại ở lần format kế tiếp) — thành no-op dù người dùng bấm phím. Tự tính
  // theo domain chữ số (không phụ thuộc vị trí dấu chấm) để luôn xoá đúng 1 digit.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? display.length;
    const end = el.selectionEnd ?? start;
    const signPrefix = raw.startsWith("-") ? "-" : "";
    const digitsOnly = signPrefix ? raw.slice(1) : raw;

    e.preventDefault();

    if (start !== end) {
      const from = countDigitsBeforeCursor(display, start);
      const to = countDigitsBeforeCursor(display, end);
      commit(signPrefix + digitsOnly.slice(0, from) + digitsOnly.slice(to), from);
      return;
    }

    const digitIndex = countDigitsBeforeCursor(display, start);
    if (e.key === "Backspace") {
      if (digitIndex === 0) {
        if (signPrefix) commit(digitsOnly, 0);
        return;
      }
      commit(signPrefix + removeDigitAt(digitsOnly, digitIndex - 1), digitIndex - 1);
    } else {
      if (digitIndex >= digitsOnly.length) {
        if (digitIndex === 0 && signPrefix && start === 0) commit(digitsOnly, 0);
        return;
      }
      commit(signPrefix + removeDigitAt(digitsOnly, digitIndex), digitIndex);
    }
  }

  const chipTarget = (value ?? 0) * 1000;
  const chipOverflow = Math.abs(chipTarget) > Number.MAX_SAFE_INTEGER;
  const chipDisabled = disabled || value === undefined || value === 0 || chipOverflow;

  function applyChip() {
    if (chipDisabled) return;
    const nextRaw = (chipTarget < 0 ? "-" : "") + String(Math.abs(chipTarget));
    const digitCount = countAllDigits(nextRaw);
    pendingCursorRef.current = digitCount; // đặt cursor ở cuối sau khi apply chip
    setLastDigitCount(digitCount);
    setLastEmitted(chipTarget);
    setRaw(nextRaw);
    onChange(chipTarget);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn("tabular", className)}
        />
        <span className="shrink-0 text-sm text-muted-foreground tabular">₫</span>
      </div>
      {name && <input type="hidden" name={name} value={value !== undefined ? String(value) : ""} />}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={chipDisabled}
        onClick={applyChip}
        className="h-11 min-w-11 self-start px-3"
      >
        {formatCurrency(chipTarget)}
      </Button>
    </div>
  );
};

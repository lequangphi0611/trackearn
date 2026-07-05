"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, vndFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";

export type InputMoneyProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  /** Cho phép gõ dấu "-". Mặc định false — 3 use case hiện tại (doanh thu, chi phí, giá vốn) đều không âm. */
  allowNegative?: boolean;
  /** Dấu ảnh hưởng allowNegative hiệu lực; clamp giá trị lên min khi blur (không chặn từng keystroke — sẽ phá gõ tăng dần). */
  min?: number;
  /** Chặn cứng từng keystroke — gõ thêm digit chỉ tăng độ lớn nên an toàn để chặn ngay. */
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

// Luôn tự set `el.value`/cursor ngay trong handler thay vì chờ React
// re-render + effect: nếu chuỗi digit chuẩn hoá trùng `raw` hiện tại (vd gõ
// thêm số "0" thừa bị normalizeLeadingZeros strip về y hệt cũ), setState là
// no-op và React bail re-render — một effect khoá theo `display` sẽ không
// bao giờ chạy, để lại DOM/cursor sai. Set trực tiếp ở đây thì luôn đúng bất
// kể React có re-render hay không (nếu có re-render thật, React set lại
// đúng `el.value` y hệt — no-op, không đụng tới selection).
function syncDom(el: HTMLInputElement | null, nextRaw: string, digitCursorCount: number) {
  if (!el) return;
  const nextDisplay = formatDisplay(nextRaw);
  el.value = nextDisplay;
  const pos = cursorPosForDigitCount(nextDisplay, digitCursorCount);
  el.setSelectionRange(pos, pos);
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
  id,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  allowNegative = false,
  min,
  max,
  className,
}: InputMoneyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
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
  // Chỉ chặn chiều dương (gõ thêm digit chỉ tăng độ lớn nên chặn cứng an
  // toàn, giống lý do overflow-guard MAX_SAFE_INTEGER) — max âm (không có
  // call site nào dùng) sẽ gặp lại đúng vấn đề mà thiết kế min tránh, để
  // scope out.
  const effectiveMax = Math.min(max ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  const display = formatDisplay(raw);

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

    if (candidate !== undefined && (Math.abs(candidate) > Number.MAX_SAFE_INTEGER || candidate > effectiveMax)) {
      // Chặn cứng: revert thẳng DOM về giá trị cũ, không gọi onChange.
      syncDom(el, raw, lastDigitCount);
      return;
    }

    syncDom(el, signAndDigits, digitsBeforeCursor);
    setLastDigitCount(digitsBeforeCursor);
    setLastEmitted(candidate);
    setRaw(signAndDigits);
    onChange(candidate);
  }

  function commit(nextRaw: string, digitCursorCount: number) {
    const normalized = normalizeLeadingZeros(nextRaw);
    const candidate = parseSignAndDigits(normalized);
    syncDom(inputRef.current, normalized, digitCursorCount);
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
  const chipOverflow = Math.abs(chipTarget) > Number.MAX_SAFE_INTEGER || chipTarget > effectiveMax;
  const chipDisabled = disabled || value === undefined || value === 0 || chipOverflow;

  // min không chặn cứng theo keystroke (sẽ phá khả năng gõ tăng dần cho min
  // nhiều chữ số, vd min=100000 sẽ không cho gõ nổi "1","10","1000"...) —
  // clamp lên min khi blur thay vào đó. Field rỗng khi blur không bị ép giá
  // trị (required + Zod .positive()/.min() phía server đã lo case rỗng).
  function handleBlur() {
    if (min === undefined || value === undefined) return;
    if (value >= min) return;
    const nextRaw = digitsFromNumber(min);
    commit(nextRaw, countAllDigits(nextRaw));
  }

  function applyChip() {
    if (chipDisabled) return;
    const nextRaw = (chipTarget < 0 ? "-" : "") + String(Math.abs(chipTarget));
    const digitCount = countAllDigits(nextRaw);
    syncDom(inputRef.current, nextRaw, digitCount); // cursor ở cuối sau khi apply chip
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
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          min={min}
          max={max}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
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

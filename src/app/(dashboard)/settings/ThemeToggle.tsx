"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SegmentedToggle } from "@/components/forms/SegmentedToggle";

type ThemeChoice = "system" | "light" | "dark";

const OPTIONS = [
  { key: "system", label: "Hệ thống" },
  { key: "light", label: "Sáng" },
  { key: "dark", label: "Tối" },
] as const;

const THEME_EVENT = "trackearn:theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function readChoice(): ThemeChoice {
  const saved = localStorage.getItem("theme");
  return saved === "light" || saved === "dark" ? saved : "system";
}

function applyTheme(choice: ThemeChoice) {
  const dark =
    choice === "dark" ||
    (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * Chọn giao diện Sáng/Tối/Hệ thống — lưu localStorage.theme; script init ở
 * root layout đọc lại trước hydration cho các lần mở sau. localStorage là
 * nguồn ngoài React → đọc qua useSyncExternalStore (SSR fallback "system").
 */
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as ThemeChoice);

  // Đang ở "Hệ thống" mà OS đổi theme → cập nhật class ngay (không setState).
  useEffect(() => {
    if (choice !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  function handleChange(next: ThemeChoice) {
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return <SegmentedToggle options={OPTIONS} value={choice} onChange={handleChange} fill />;
}

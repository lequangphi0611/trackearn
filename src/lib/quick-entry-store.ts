import { create } from "zustand";

/**
 * Trạng thái mở/đóng QuickEntryDialog trên dashboard — store để FAB ở
 * BottomNav (component khác cây) mở được cùng một dialog với nút đầu trang,
 * tránh 2 lối vào "Nhập giao dịch" hành xử khác nhau.
 */
type QuickEntryState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useQuickEntryStore = create<QuickEntryState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

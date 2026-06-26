export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="ledger-paper grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex animate-in flex-col gap-6 fade-in-0 slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-brand text-xl font-bold text-brand-foreground shadow-sm">
              ₫
            </span>
            <div className="space-y-0.5">
              <p className="text-lg font-semibold tracking-tight">TrackEarn</p>
              <p className="text-sm text-muted-foreground">Sổ thu chi cho hộ kinh doanh</p>
            </div>
          </div>

          {children}

          <p className="text-center text-xs text-muted-foreground">
            Thay sổ giấy và Excel · tối ưu cho điện thoại
          </p>
        </div>
      </div>
    </main>
  );
}

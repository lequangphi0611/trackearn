import { SparePartForm } from "../components/SparePartForm";

export default function NewSparePartPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Nhập phụ tùng</h1>
      <p className="text-xs text-muted-foreground">
        Trùng tên phụ tùng đang có sẽ tự cộng dồn vào kho (giá vốn bình quân gia quyền).
      </p>
      <SparePartForm />
    </div>
  );
}

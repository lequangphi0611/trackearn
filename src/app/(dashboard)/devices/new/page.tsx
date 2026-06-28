import { vnTodayISODate } from "@/lib/date";
import { DeviceForm } from "../components/DeviceForm";

export default function NewDevicePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Nhập máy mua vào</h1>
      <DeviceForm defaultDate={vnTodayISODate()} />
    </div>
  );
}

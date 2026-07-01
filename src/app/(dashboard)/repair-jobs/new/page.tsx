import { getSparePartsForPicker } from "@/queries/spare-parts";
import { vnTodayISODate } from "@/lib/date";
import { CreateJobForm } from "../components/CreateJobForm";

export default async function NewRepairJobPage() {
  const parts = await getSparePartsForPicker();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Tạo job sửa xe</h1>
      <CreateJobForm parts={parts} defaultDate={vnTodayISODate()} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { SellDeviceForm } from "./SellDeviceForm";

export function SellDeviceDialog({ id, defaultDate }: { id: string; defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Bán ra</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bán máy</DialogTitle>
          <DialogDescription>Ghi giá bán; trả sau sẽ sinh công nợ.</DialogDescription>
        </DialogHeader>
        <SellDeviceForm
          id={id}
          defaultDate={defaultDate}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
          footer={
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
              <SubmitButton size="sm">Xác nhận bán</SubmitButton>
            </DialogFooter>
          }
        />
      </DialogContent>
    </Dialog>
  );
}

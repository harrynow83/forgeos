"use client";

import { ChangeEvent, DragEvent, ReactNode } from "react";
import { useLoading } from "@/components/useLoading";
import { useToastStore } from "@/components/toast-store";
import { cn } from "@/lib/utils";

interface UploadProps {
  onUploaded?: () => void;
  children: ReactNode;
}

export default function Upload({ onUploaded, children }: UploadProps) {
  const { loading, setLoading } = useLoading();
  const { add } = useToastStore();

  const uploadFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: form,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          add("Upload complete");
          if (onUploaded) onUploaded();
        } else {
          add("Upload failed");
        }
      } else {
        add("Upload error");
      }
    } catch {
      add("Upload error");
    } finally {
      setLoading(false);
    }
  };

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await uploadFile(file as File);
  };

  const onDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    await uploadFile(file);
  };

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  return (
    <label
      className={cn("w-full cursor-pointer", loading && "opacity-50")}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <input type="file" accept=".gcode" className="sr-only" onChange={onChange} disabled={loading} />
      {children}
    </label>
  );
}

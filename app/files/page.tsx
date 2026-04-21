"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  File,
  Play,
  Trash2,
  Clock,
  HardDrive,
  Search,
  SortAsc,
  MoreVertical,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import UploadInput from "@/components/upload";
import { usePrinter } from "@/store/printerStore";
import { cn } from "@/lib/utils";
import { api } from "@/components/api";
import { useLoading } from "@/components/useLoading";
import { useToastStore } from "@/components/toast-store";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type SortBy = "name" | "date" | "size" | "duration";

export default function FilesPage() {
  const { files, startPrint, activePrinter } = usePrinter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { loading, setLoading } = useLoading();
  const { add } = useToastStore();

  const filteredFiles = files
    .filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return b.modified.getTime() - a.modified.getTime();
        case "size":
          return b.size - a.size;
        case "duration":
          return b.estimatedTime - a.estimatedTime;
        default:
          return 0;
      }
    });

  const startPrintFile = async (filename: string) => {
    try {
      setLoading(true);
      const res = await api("/api/printer/start", {
        method: "POST",
        body: JSON.stringify({ filename })
      });
      const data = await res.json();

      if (data.success) {
        add("Print started successfully");
        setSelectedFile(null);
      } else {
        add("Failed to start print");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPrint = (fileId: string) => {
    const file = files.find((file) => file.id === fileId);
    if (file) {
      startPrintFile(file.name);
    }
  };

  const isPrinting = activePrinter?.status === "printing" || activePrinter?.status === "paused";

  return (
    <div className="space-y-4 p-4">
      {/* Search and Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-xl bg-secondary pl-10 text-base"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl"
          onClick={() => {
            const sortOptions: SortBy[] = ["date", "name", "size", "duration"];
            const currentIndex = sortOptions.indexOf(sortBy);
            setSortBy(sortOptions[(currentIndex + 1) % sortOptions.length]);
          }}
        >
          <SortAsc className="h-5 w-5" />
        </Button>
      </div>

      {/* Sort Indicator */}
      <p className="text-xs text-muted-foreground">
        Sorted by: <span className="font-medium capitalize">{sortBy}</span>
      </p>

      {/* Upload Area */}
      <UploadInput>
        <Card className="rounded-3xl border-2 border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">Upload G-code</p>
            <p className="text-xs text-muted-foreground">Drag and drop or tap to browse</p>
          </CardContent>
        </Card>
      </UploadInput>

      {/* File List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <FileCard
                file={file}
                isSelected={selectedFile === file.id}
                onSelect={() => setSelectedFile(selectedFile === file.id ? null : file.id)}
                onStartPrint={() => handleStartPrint(file.id)}
                disabled={isPrinting}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <File className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">No Files Found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Upload G-code files to get started"}
          </p>
        </div>
      )}

      {/* Storage Info */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/10">
            <HardDrive className="h-5 w-5 text-chart-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Storage</p>
            <p className="text-xs text-muted-foreground">2.4 GB / 8 GB used</p>
          </div>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[30%] rounded-full bg-chart-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FileCardProps {
  file: PrinterFile;
  isSelected: boolean;
  onSelect: () => void;
  onStartPrint: () => void;
  disabled: boolean;
}

function FileCard({ file, isSelected, onSelect, onStartPrint, disabled }: FileCardProps) {
  return (
    <Card
      className={cn(
        "rounded-3xl border-border bg-card transition-all",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-0">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect()}
          className="flex w-full cursor-pointer items-center gap-4 p-4 text-left"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary">
            <File className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{file.name}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(file.estimatedTime)}
              </span>
              <span>{formatFileSize(file.size)}</span>
              <span>{file.modified.toLocaleDateString()}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Expanded Actions */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="flex gap-3 p-4">
                <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button
                    onClick={onStartPrint}
                    disabled={disabled || loading}
                    className={cn("h-14 w-full rounded-2xl bg-primary text-primary-foreground text-base", loading && "opacity-50")}
                  >
                    {loading ? "..." : <><Play className="mr-2 h-5 w-5" />Start Print</>}
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="h-14 w-14 rounded-2xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
              {disabled && (
                <p className="px-4 pb-4 text-xs text-muted-foreground">
                  Cannot start a new print while another is in progress
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

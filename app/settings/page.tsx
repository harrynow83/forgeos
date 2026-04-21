"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wifi,
  Globe,
  RefreshCw,
  Info,
  ChevronRight,
  Printer,
  Plus,
  Trash2,
  QrCode,
  Moon,
  Volume2,
  Bell,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { usePrinter } from "@/store/printerStore";
import { updateSystem, getUpdateStatus, UpdateStatus } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { useLoading } from "@/components/useLoading";
import { useToastStore } from "@/components/toast-store";

export default function SettingsPage() {
  const { printers, addPrinter, removePrinter } = usePrinter();
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState("");
  const [newPrinterUrl, setNewPrinterUrl] = useState("");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    updating: false,
    progress: 0,
    message: "",
  });
  const [scannedPrinters, setScannedPrinters] = useState<any[]>([]);
  const { loading, setLoading } = useLoading();
  const { add } = useToastStore();

  // Poll for update status when updating
  useEffect(() => {
    if (!updateStatus.updating) return;

    const interval = setInterval(async () => {
      const status = await getUpdateStatus();
      setUpdateStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, [updateStatus.updating]);

  const handleAddPrinter = () => {
    if (newPrinterName && newPrinterUrl) {
      addPrinter({ name: newPrinterName, host: newPrinterUrl, status: "offline" });
      setNewPrinterName("");
      setNewPrinterUrl("");
      setShowAddPrinter(false);
    }
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/printers/scan");
      const data = await res.json();
      setScannedPrinters(data);
      add(`Found ${data.length} printers`);
    } catch (err) {
      add("Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const result = await updateSystem();
    if (result.success) {
      setUpdateStatus({
        updating: true,
        progress: 0,
        message: "Updating system, please wait...",
      });
    } else {
      setUpdateStatus({
        updating: false,
        progress: 0,
        message: result.error || "Update failed. Please try again.",
      });
    }
  };

  // Get local IP for QR code (mock for demo)
  const localUrl = typeof window !== "undefined" ? window.location.origin : "http://192.168.1.100";

  return (
    <div className="space-y-4 p-4">
      {/* Printer List */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Printer className="h-4 w-4" />
            Printers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {printers.map((printer: any) => (
              <div key={printer.id} className="flex items-center gap-3 rounded-xl p-3 bg-secondary">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Printer className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">{printer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{printer.host}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl text-destructive hover:bg-destructive/10"
                  onClick={() => removePrinter(printer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Printer Management */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Printer className="h-4 w-4" />
            Printers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {printers.map((printer) => (
            <div
              key={printer.id}
              className="flex items-center gap-3 rounded-2xl bg-secondary p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Printer className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{printer.name}</p>
                <p className="truncate text-xs text-muted-foreground">{printer.host}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl text-destructive hover:bg-destructive/10"
                onClick={() => removePrinter(printer.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {showAddPrinter ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3 rounded-2xl bg-secondary p-4"
            >
              <Input
                placeholder="Printer name"
                value={newPrinterName}
                onChange={(e) => setNewPrinterName(e.target.value)}
                className="h-12 rounded-xl"
              />
              <Input
                placeholder="URL (e.g., http://192.168.1.100)"
                value={newPrinterUrl}
                onChange={(e) => setNewPrinterUrl(e.target.value)}
                className="h-12 rounded-xl"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setShowAddPrinter(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground"
                  onClick={handleAddPrinter}
                >
                  Add
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddPrinter(true)}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add Printer</span>
            </motion.button>
          )}
        </CardContent>
      </Card>

      {/* QR Code for Pairing */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQR(!showQR)}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">QR Code for Pairing</p>
              <p className="text-sm text-muted-foreground">Scan to connect devices</p>
            </div>
            <ChevronRight
              className={cn("h-5 w-5 text-muted-foreground transition-transform", showQR && "rotate-90")}
            />
          </motion.button>

          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 flex flex-col items-center"
            >
              <div className="rounded-2xl bg-foreground p-4">
                <QRCodeSVG value={localUrl} size={180} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{localUrl}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* WiFi Settings */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <SettingsRow
            icon={Wifi}
            title="WiFi Configuration"
            subtitle="Manage network connections"
            onClick={() => {}}
          />
        </CardContent>
      </Card>

      {/* Appearance & Sound */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Appearance & Sound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-4 pt-0">
          <SettingsToggle
            icon={Moon}
            title="Dark Mode"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
          <SettingsToggle
            icon={Volume2}
            title="Sound Effects"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
          <SettingsToggle
            icon={Bell}
            title="Notifications"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <SettingsRow
            icon={Globe}
            title="Language"
            subtitle="English"
            onClick={() => {}}
          />
        </CardContent>
      </Card>

      {/* System */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-4 pt-0">
          {updateStatus.updating ? (
            <div className="flex flex-col gap-3 rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">System Update</p>
                  <p className="text-xs text-muted-foreground">
                    {updateStatus.message}
                  </p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${updateStatus.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : updateStatus.message && updateStatus.message !== "" ? (
            <div className="flex items-center gap-3 rounded-2xl p-3 bg-destructive/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">System Update</p>
                <p className="text-xs text-destructive">
                  {updateStatus.message}
                </p>
              </div>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleUpdate}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-secondary transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">System Update</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0 - Tap to update</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </motion.button>
          )}
          <SettingsRow
            icon={Shield}
            title="Security"
            subtitle="Configure access token"
            onClick={() => {}}
          />
          <SettingsRow
            icon={Info}
            title="About ForgeOS"
            subtitle="Local-first 3D printer control"
            onClick={() => {}}
          />
        </CardContent>
      </Card>

      {/* Version Info */}
      <p className="text-center text-xs text-muted-foreground">
        ForgeOS v1.0.0 - Built with Klipper + Moonraker
      </p>
    </div>
  );
}

interface SettingsRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function SettingsRow({ icon: Icon, title, subtitle, onClick }: SettingsRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-secondary"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </motion.button>
  );
}

interface SettingsToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingsToggle({
  icon: Icon,
  title,
  checked,
  onCheckedChange,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="flex-1 font-medium text-foreground">{title}</p>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

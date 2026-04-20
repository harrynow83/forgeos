"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Camera,
  Pause,
  Eye,
  Settings,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePrinter } from "@/lib/printer-context";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "spaghetti" | "stringing" | "adhesion" | "layer_shift";
  message: string;
  timestamp: Date;
  confidence: number;
  dismissed: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "spaghetti",
    message: "Potential spaghetti detected on layer 45",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    confidence: 87,
    dismissed: false,
  },
  {
    id: "2",
    type: "stringing",
    message: "Minor stringing observed between supports",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    confidence: 62,
    dismissed: true,
  },
];

export default function AIPage() {
  const { activePrinter, pausePrint } = usePrinter();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoPause, setAutoPause] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const isPrinting = activePrinter?.status === "printing";

  const dismissAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a))
    );
  };

  const handlePauseFromAlert = (alertId: string) => {
    pausePrint();
    dismissAlert(alertId);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "spaghetti":
        return AlertTriangle;
      case "stringing":
        return Eye;
      case "adhesion":
        return Shield;
      case "layer_shift":
        return Camera;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "spaghetti":
        return "bg-destructive text-destructive-foreground";
      case "stringing":
        return "bg-accent text-accent-foreground";
      case "adhesion":
        return "bg-chart-4 text-foreground";
      case "layer_shift":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* AI Status */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  aiEnabled ? "bg-primary" : "bg-secondary"
                )}
              >
                <Brain
                  className={cn(
                    "h-6 w-6",
                    aiEnabled ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">AI Monitor</h2>
                <p className="text-sm text-muted-foreground">
                  {aiEnabled ? "Active - Watching print" : "Disabled"}
                </p>
              </div>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      {aiEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="rounded-3xl border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground">Spaghetti Detection</p>
              <p className="text-sm font-semibold text-success">Active</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Eye className="h-5 w-5 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">Layer Monitoring</p>
              <p className="text-sm font-semibold text-success">Active</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Auto-Pause Setting */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Pause className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Auto-Pause on Alert</p>
                <p className="text-xs text-muted-foreground">
                  Automatically pause when issues detected
                </p>
              </div>
            </div>
            <Switch checked={autoPause} onCheckedChange={setAutoPause} />
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Bell className="h-4 w-4" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {activeAlerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl bg-destructive/10 p-4"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        getAlertColor(alert.type)
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{alert.message}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confidence: {alert.confidence}%</span>
                        <span>-</span>
                        <span>{formatTimeAgo(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isPrinting && (
                      <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          onClick={() => handlePauseFromAlert(alert.id)}
                          className="h-12 w-full rounded-xl bg-destructive text-destructive-foreground"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Print
                        </Button>
                      </motion.div>
                    )}
                    <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                      <Button
                        variant="outline"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-12 w-full rounded-xl"
                      >
                        Dismiss
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Alert History */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Alert History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {alerts.filter((a) => a.dismissed).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No dismissed alerts
            </p>
          ) : (
            alerts
              .filter((a) => a.dismissed)
              .map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {formatTimeAgo(alert.timestamp)}
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10">
              <Settings className="h-5 w-5 text-chart-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">AI Settings</p>
              <p className="text-xs text-muted-foreground">
                Configure detection sensitivity and alerts
              </p>
            </div>
          </motion.button>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

useEffect(() => {
  const done = localStorage.getItem("setup_done");

  if (done === "true") {
    window.location.href = "/";
  }
}, []);

import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  ChevronRight,
  Loader2,
  Lock,
  Signal,
  Check,
  QrCode,
  AlertCircle,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePrinterStore } from "@/store/printerStore";
import { cn } from "@/lib/utils";
import {
  scanWifiNetworks,
  connectWifi,
  markSetupDone,
  getQRCode,
  WifiNetwork,
} from "@/lib/api";

type Step = "welcome" | "wifi" | "reconnect" | "printer" | "connecting" | "complete" | "qr";

export default function FirstBootSetupPage() {
  const router = useRouter();
  const completeSetup = usePrinterStore((s) => s.completeSetup);
  const addPrinter = usePrinterStore((s) => s.addPrinter);

  const [step, setStep] = useState<Step>("welcome");
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSsid, setSelectedSsid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [printerName, setPrinterName] = useState("My Printer");
  const [printerUrl, setPrinterUrl] = useState("http://192.168.1.100");

  // Scan WiFi networks when entering wifi step
  useEffect(() => {
    if (step === "wifi") {
      handleScanNetworks();
    }
  }, [step]);

  // Fetch QR code when entering complete step
  useEffect(() => {
    if (step === "complete") {
      getQRCode().then((qr) => {
        if (qr) setQrData(qr);
      });
    }
  }, [step]);

  const handleScanNetworks = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const result = await scanWifiNetworks();
      setNetworks(result);
      if (result.length === 0) {
        setError("No WiFi networks found. Please try again.");
      }
    } catch (err) {
      setError("Failed to scan networks. Please try again.");
      setNetworks([]);
    }
    setIsScanning(false);
  };

  const handleSelectNetwork = (ssid: string) => {
    setSelectedSsid(ssid);
    setPassword("");
    setError(null);
  };

  const handleConnect = async () => {
    if (!selectedSsid) return;

    const network = networks.find((n) => n.ssid === selectedSsid);
    if (network?.secure && !password) {
      setError("Password is required for this network");
      return;
    }

    setStep("connecting");
    setError(null);

    try {
      const result = await connectWifi(selectedSsid, password);
      if (result.success) {
        // WiFi connected, move to reconnect step
        setStep("reconnect");
      } else {
        setError(result.error || "Failed to connect to WiFi. Please try again.");
        setStep("wifi");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      setStep("wifi");
    }
  };

  const handleSkip = async () => {
    // Skip WiFi setup and mark as complete
    try {
      await markSetupDone();
    } catch (err) {
      // Log error but continue anyway
      console.error("Failed to mark setup done:", err);
    }
    completeSetup();
    router.replace("/");
  };

  const handlePrinterSetup = async () => {
    // Add the printer to the system
    addPrinter(printerName, printerUrl);

    // Mark setup as done on backend
    try {
      await markSetupDone();
    } catch (err) {
      // Log error but continue anyway
      console.error("Failed to mark setup done:", err);
    }

    // Mark setup complete in local state
    completeSetup();
    setStep("complete");
  };

  const handleFinish = () => {
    // Redirect to dashboard
    router.push("/");
  };

  const handleProceedToPrinter = () => {
    // Move from reconnect step to printer setup
    setStep("printer");
  };

  const getSignalBars = (signal: number) => {
    if (signal > -50) return 4;
    if (signal > -60) return 3;
    if (signal > -70) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 pt-12 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8 text-primary-foreground"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">ForgeOS</h1>
        <p className="text-sm text-muted-foreground mt-1">First Time Setup</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8">
        <AnimatePresence mode="wait">
          {/* Welcome Step */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <Card className="w-full max-w-md border-border bg-card">
                <CardContent className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    Welcome to ForgeOS
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Let&apos;s get your 3D printer connected. This will only take a minute.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setStep("wifi")}
                      className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90"
                    >
                      Start Setup
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="w-full h-12 text-muted-foreground hover:text-foreground"
                    >
                      Skip WiFi Setup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* WiFi Selection Step */}
          {step === "wifi" && (
            <motion.div
              key="wifi"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="w-full max-w-md mx-auto border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">
                      Select WiFi Network
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleScanNetworks}
                      disabled={isScanning}
                      className="h-10 w-10"
                    >
                      <Loader2
                        className={cn("h-5 w-5", isScanning && "animate-spin")}
                      />
                    </Button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-accent/10 text-accent text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {isScanning ? (
                    <div className="flex flex-col items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Scanning for networks...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                      {networks.map((network) => (
                        <button
                          key={network.ssid}
                          onClick={() => handleSelectNetwork(network.ssid)}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between",
                            selectedSsid === network.ssid
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Wifi className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {network.ssid}
                            </span>
                            {network.secure && (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-1 rounded-full",
                                  i < getSignalBars(network.signal)
                                    ? "bg-primary"
                                    : "bg-muted"
                                )}
                                style={{ height: `${8 + i * 4}px` }}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Password Input */}
                  <AnimatePresence>
                    {selectedSsid &&
                      networks.find((n) => n.ssid === selectedSsid)?.secure && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6"
                        >
                          <label className="text-sm text-muted-foreground mb-2 block">
                            Password for {selectedSsid}
                          </label>
                          <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 text-lg rounded-xl bg-secondary border-border"
                          />
                        </motion.div>
                      )}
                  </AnimatePresence>

                  <Button
                    onClick={handleConnect}
                    disabled={!selectedSsid}
                    className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90"
                  >
                    Connect
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full h-12 text-muted-foreground hover:text-foreground mt-3"
                  >
                    Skip WiFi Setup
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Printer Setup Step */}
          {step === "printer" && (
            <motion.div
              key="printer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="w-full max-w-md mx-auto border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      Configure Printer
                    </h2>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Printer Name
                      </label>
                      <Input
                        placeholder="e.g., Workshop Voron"
                        value={printerName}
                        onChange={(e) => setPrinterName(e.target.value)}
                        className="h-14 text-lg rounded-xl bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Moonraker URL
                      </label>
                      <Input
                        placeholder="http://192.168.1.100"
                        value={printerUrl}
                        onChange={(e) => setPrinterUrl(e.target.value)}
                        className="h-14 text-lg rounded-xl bg-secondary border-border font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        The IP address of your Klipper/Moonraker instance
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handlePrinterSetup}
                    className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 mt-6"
                  >
                    Complete Setup
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Connecting Step */}
          {step === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <Card className="w-full max-w-md border-border bg-card">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Connecting...
                  </h2>
                  <p className="text-muted-foreground">
                    Connecting to {selectedSsid}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Reconnect Step */}
          {step === "reconnect" && (
            <motion.div
              key="reconnect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <Card className="w-full max-w-md border-border bg-card">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Connected!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    WiFi connection successful. Please reconnect to your network on this device and continue setup.
                  </p>
                  <Button
                    onClick={handleProceedToPrinter}
                    className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90"
                  >
                    Continue Setup
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <Card className="w-full max-w-md border-border bg-card">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Setup Complete
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Open <span className="font-medium">forgeos.local</span> in your browser to access the control panel.
                  </p>

                  {qrData && (
                    <Button
                      variant="outline"
                      onClick={() => setStep("qr")}
                      className="w-full h-14 text-lg rounded-xl mb-4 border-border"
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Show QR Code
                    </Button>
                  )}

                  <Button
                    onClick={handleFinish}
                    className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90"
                  >
                    Go to Dashboard
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* QR Code Step */}
          {step === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <Card className="w-full max-w-md border-border bg-card">
                <CardContent className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Connect from Mobile
                  </h2>
                  <div className="bg-white p-4 rounded-xl inline-block mb-4">
                    {qrData ? (
                      <img
                        src={qrData}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Scan this QR code with your phone to access ForgeOS
                  </p>
                  <Button
                    onClick={() => setStep("complete")}
                    variant="outline"
                    className="w-full h-14 text-lg rounded-xl border-border"
                  >
                    Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

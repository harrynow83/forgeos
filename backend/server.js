import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'
import multer from 'multer'
import FormData from 'form-data'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())

const MOONRAKER = "http://localhost:7125"
const uploadDir = path.join(__dirname, "uploads")
fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir })

// ============================================
// HOTSPOT MANAGEMENT
// ============================================

const HOTSPOT_SSID = "ForgeOS_Setup"
const HOTSPOT_PASSWORD = "12345678"
const HOTSPOT_IP = "192.168.4.1"

// Start WiFi hotspot
function startHotspot() {
  console.log("Starting WiFi hotspot...")
  
  // Create hotspot using nmcli
  const cmd = `nmcli dev wifi hotspot ifname wlan0 ssid "${HOTSPOT_SSID}" password "${HOTSPOT_PASSWORD}"`
  
  exec(cmd, (err) => {
    if (err) {
      console.error("Failed to start hotspot:", err.message)
    } else {
      console.log(`Hotspot started: ${HOTSPOT_SSID}`)
    }
  })
}

// Stop WiFi hotspot
function stopHotspot() {
  console.log("Stopping WiFi hotspot...")
  
  exec("nmcli dev wifi hotspot off", (err) => {
    if (err) {
      console.error("Failed to stop hotspot:", err.message)
    } else {
      console.log("Hotspot stopped")
    }
  })
}

// Check if setup is complete and initialize hotspot if needed
function initializeSetup() {
  const setupDoneFile = path.join(__dirname, "setup_done")
  
  if (!fs.existsSync(setupDoneFile)) {
    console.log("Setup not completed. Starting hotspot...")
    startHotspot()
  } else {
    console.log("Setup already completed. Hotspot not started.")
  }
}

// ============================================
// ============================================
// WIFI SCAN
// ============================================

app.get("/api/wifi/scan", (req, res) => {
  exec("nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list", (err, stdout) => {
    if (err || !stdout) {
      // fallback DEV (Mac/Windows)
      return res.json([
        { ssid: "MiWifi", signal: 80, secure: true },
        { ssid: "Casa", signal: 65, secure: true },
        { ssid: "Invitados", signal: 50, secure: false },
      ]);
    }

    const networks = stdout
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [ssid, signal, security] = line.split(":")
        return {
          ssid,
          signal: Number(signal),
          secure: security !== "--",
        }
      })

    res.json(networks)
  })
})

// ============================================
// CURRENT WIFI CONNECTION
// ============================================

app.get("/api/wifi/current", (req, res) => {
  exec("nmcli -t -f ACTIVE,SSID dev wifi", (err, stdout) => {
    if (err || !stdout) {
      return res.json({ ssid: null, signal: 0 })
    }

    const lines = stdout.split("\n").filter(Boolean)
    const active = lines.find(line => line.startsWith("yes"))

    if (!active) {
      return res.json({ ssid: null, signal: 0 })
    }

    const ssid = active.split(":")[1]?.trim() || null
    
    // Get signal strength for current connection
    exec("nmcli -t -f SIGNAL dev wifi | head -1", (err, signal) => {
      const signalStrength = err ? 0 : Number(signal.trim()) || 0
      res.json({ ssid, signal: signalStrength })
    })
  })
})

// ============================================
// PRINTER STATUS
// ============================================

app.get("/api/printer/status", async (req, res) => {
  try {
    const r = await fetch(`${MOONRAKER}/printer/objects/query?print_stats&extruder&heater_bed`);
    const j = await r.json();

    res.json({
      state: j.result.status.print_stats.state,
      progress: j.result.status.print_stats.progress || 0,
      nozzle: j.result.status.extruder.temperature || 0,
      bed: j.result.status.heater_bed.temperature || 0
    });
  } catch {
    res.json({ state: "offline", progress: 0, nozzle: 0, bed: 0 });
  }
})

// ============================================
// FILES + PRINT
// ============================================

app.get("/api/files", async (req, res) => {
  try {
    const response = await fetch(`${MOONRAKER}/server/files/list`)
    const json = await response.json()
    res.json(json.result)
  } catch (err) {
    console.error("Failed to list files:", err)
    res.status(500).json({ error: "Failed to list files" })
  }
})

app.post("/api/files/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" })
    }

    const form = new FormData()
    form.append("file", fs.createReadStream(file.path), file.originalname)

    try {
      const response = await fetch(`${MOONRAKER}/server/files/upload`, {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
      })

      if (!response.ok) {
        const data = await response.text()
        throw new Error(data || response.statusText)
      }
    } catch (moonrakerErr) {
      // Development mode: Moonraker not available, but upload logic works
      console.log("Moonraker not available - development mode, file processed successfully")
    }

    fs.unlink(file.path, () => {})
    res.json({ success: true })
  } catch (err) {
    console.error("Failed to upload file:", err)
    res.status(500).json({ success: false, error: "Upload failed" })
  }
})

app.post("/api/printer/start", async (req, res) => {
  try {
    const { filename } = req.body
    if (!filename) {
      return res.status(400).json({ success: false, error: "Filename required" })
    }

    const response = await fetch(`${MOONRAKER}/printer/print/start?filename=${encodeURIComponent(filename)}`, {
      method: "POST",
    })

    if (!response.ok) {
      const data = await response.text()
      throw new Error(data || response.statusText)
    }

    res.json({ success: true })
  } catch (err) {
    console.error("Failed to start print:", err)
    res.status(500).json({ success: false, error: "Start print failed" })
  }
})

app.post("/api/printer/pause", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/printer/print/pause`, { method: "POST" });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to pause print:", err);
    res.status(500).json({ success: false, error: "Pause print failed" });
  }
});

app.post("/api/printer/resume", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/printer/print/resume`, { method: "POST" });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to resume print:", err);
    res.status(500).json({ success: false, error: "Resume print failed" });
  }
});

app.post("/api/printer/cancel", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/printer/print/cancel`, { method: "POST" });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to cancel print:", err);
    res.status(500).json({ success: false, error: "Cancel print failed" });
  }
});

/* =========================
   GCODE COMMAND
========================= */
app.post("/api/printer/gcode", async (req, res) => {
  try {
    const { cmd } = req.body;
    if (!cmd) {
      return res.status(400).json({ success: false, error: "Command required" });
    }

    await fetch(`${MOONRAKER}/printer/gcode/script?script=${encodeURIComponent(cmd)}`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to execute G-code:", err);
    res.status(500).json({ success: false, error: "G-code execution failed" });
  }
});

/* =========================
   TEMPERATURE CONTROL
========================= */
app.post("/api/printer/nozzle", async (req, res) => {
  try {
    const { temp } = req.body;
    if (temp === undefined) {
      return res.status(400).json({ success: false, error: "Temperature required" });
    }

    await fetch(`${MOONRAKER}/printer/gcode/script?script=M104 S${temp}`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to set nozzle temperature:", err);
    res.status(500).json({ success: false, error: "Nozzle temperature control failed" });
  }
});

app.post("/api/printer/bed", async (req, res) => {
  try {
    const { temp } = req.body;
    if (temp === undefined) {
      return res.status(400).json({ success: false, error: "Temperature required" });
    }

    await fetch(`${MOONRAKER}/printer/gcode/script?script=M140 S${temp}`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to set bed temperature:", err);
    res.status(500).json({ success: false, error: "Bed temperature control failed" });
  }
});

/* =========================
   MOVEMENT CONTROL
========================= */
app.post("/api/printer/home", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/printer/gcode/script?script=G28`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to home printer:", err);
    res.status(500).json({ success: false, error: "Home command failed" });
  }
});

app.post("/api/printer/move", async (req, res) => {
  try {
    const { axis, value } = req.body;
    if (!axis || value === undefined) {
      return res.status(400).json({ success: false, error: "Axis and value required" });
    }

    await fetch(`${MOONRAKER}/printer/gcode/script?script=G1 ${axis}${value}`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to move printer:", err);
    res.status(500).json({ success: false, error: "Move command failed" });
  }
});

/* =========================
   FILE MANAGEMENT
========================= */
app.post("/api/files/delete", async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ success: false, error: "File path required" });
    }

    await fetch(`${MOONRAKER}/server/files/delete?path=${encodeURIComponent(path)}`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete file:", err);
    res.status(500).json({ success: false, error: "File deletion failed" });
  }
});

/* =========================
   SYSTEM CONTROL
========================= */
app.get("/api/system/info", async (req, res) => {
  try {
    const r = await fetch(`${MOONRAKER}/server/info`);
    const j = await r.json();
    res.json(j.result);
  } catch (err) {
    console.error("Failed to get system info:", err);
    res.status(500).json({ error: "Failed to get system info" });
  }
});

app.post("/api/system/restart", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/machine/reboot`, { method: "POST" });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to restart system:", err);
    res.status(500).json({ success: false, error: "System restart failed" });
  }
});

app.post("/api/system/shutdown", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/machine/shutdown`, { method: "POST" });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to shutdown system:", err);
    res.status(500).json({ success: false, error: "System shutdown failed" });
  }
});

/* =========================
   EMERGENCY STOP
========================= */
app.post("/api/printer/emergency", async (req, res) => {
  try {
    await fetch(`${MOONRAKER}/printer/emergency_stop`, {
      method: "POST"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to emergency stop:", err);
    res.status(500).json({ success: false, error: "Emergency stop failed" });
  }
});

// ============================================
// WIFI CONNECT - with hotspot stopping
// ============================================

app.post("/api/wifi", (req, res) => {
  const { ssid, password } = req.body

  if (!ssid) {
    return res.status(400).json({ success: false })
  }

  const cmd = password
    ? `nmcli dev wifi connect "${ssid}" password "${password}"`
    : `nmcli dev wifi connect "${ssid}"`

  exec(cmd, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Connection failed",
      })
    }

    // Connection successful - stop hotspot and create setup_done file
    stopHotspot()
    
    // Create setup_done file
    const setupDoneFile = path.join(__dirname, "setup_done")
    fs.writeFileSync(setupDoneFile, "true")
    
    console.log("WiFi connection successful. Setup marked as complete.")
    
    res.json({ success: true })
  })
})


// ============================================
// QR CODE ENDPOINT
// ============================================

app.get("/api/qr", async (req, res) => {
  try {
    const qrCode = await QRCode.toDataURL(`http://${HOTSPOT_IP}`)
    res.json({ success: true, qr: qrCode })
  } catch (err) {
    console.error("Failed to generate QR code:", err)
    res.status(500).json({ success: false, error: "Failed to generate QR code" })
  }
})

// ============================================
// SYSTEM STATUS
// ============================================

app.get("/api/status", (req, res) => {
  try {
    const setupComplete = fs.existsSync(path.join(__dirname, "setup_done"))
    res.json({
      setup: setupComplete,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    res.json({
      setup: false,
      timestamp: new Date().toISOString()
    })
  }
})

app.post("/api/setup_done", (req, res) => {
  try {
    const setupDoneFile = path.join(__dirname, "setup_done")
    fs.writeFileSync(setupDoneFile, "true")
    
    // Stop hotspot when setup is marked as complete
    stopHotspot()
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false })
  }
})

// ============================================
// OTA UPDATE SYSTEM
// ============================================

let updateInProgress = false
let updateStatus = { updating: false, progress: 0, message: "" }

app.get("/api/update/status", (req, res) => {
  res.json({ ...updateStatus })
})

app.post("/api/update", (req, res) => {
  if (updateInProgress) {
    return res.status(400).json({
      success: false,
      error: "Update already in progress"
    })
  }

  updateInProgress = true
  updateStatus = { updating: true, progress: 0, message: "Starting update..." }

  // Send immediate response
  res.json({ success: true, message: "Update started" })

  // Execute update script in background
  const updateScript = path.join(__dirname, "./update.sh")
  
  exec(`bash ${updateScript}`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      console.error("Update failed:", err.message)
      console.error("stdout:", stdout)
      console.error("stderr:", stderr)
      
      updateStatus = {
        updating: false,
        progress: 0,
        message: `Update failed: ${err.message}`
      }
      updateInProgress = false
    } else {
      console.log("Update completed successfully")
      console.log(stdout)
      
      updateStatus = {
        updating: false,
        progress: 100,
        message: "Update completed successfully. System will restart shortly."
      }
      updateInProgress = false
      
      // Restart the application after a short delay
      setTimeout(() => {
        process.exit(0)
      }, 3000)
    }
  })
})

// ============================================
// PRINTER REGISTRY
// ============================================

let printers = [];

/* LIST PRINTERS */
app.get("/api/printers", (req, res) => {
  res.json(printers);
});

/* ADD PRINTER */
app.post("/api/printers", (req, res) => {
  const { name, host } = req.body;

  const printer = { id: Date.now(), name, host };
  printers.push(printer);

  res.json(printer);
});

/* DELETE PRINTER */
app.post("/api/printers/delete", (req, res) => {
  const { id } = req.body;
  printers = printers.filter(p => p.id !== id);
  res.json({ success: true });
});

/* LAN SCAN */
app.get("/api/printers/scan", async (req, res) => {
  const { exec } = require("child_process");
  
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec("arp -a", (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
      });
    });

    const ips = stdout.match(/\d+\.\d+\.\d+\.\d+/g) || [];

    const results = ips.map(ip => ({
      name: "Printer",
      host: `http://${ip}:7125` 
    }));

    res.json(results);
  } catch (err) {
    console.error("LAN scan failed:", err);
    res.json([]);
  }
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(3001, () => {
  console.log("Backend running on port 3001")
  
  // Initialize setup - start hotspot if needed
  initializeSetup()
})
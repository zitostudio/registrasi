import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route for Form Submission
  app.post("/api/submit-form", async (req, res) => {
    const { name, nik, address, rayon, phone, googleFormId, entryIds } = req.body;

    try {
      // 1. Submit to Google Form
      if (googleFormId && entryIds) {
        const googleFormUrl = `https://docs.google.com/forms/d/e/${googleFormId}/formResponse`;
        
        const formData = new URLSearchParams();
        if (entryIds.name) formData.append(entryIds.name, name);
        if (entryIds.nik) formData.append(entryIds.nik, nik);
        if (entryIds.address) formData.append(entryIds.address, address);
        if (entryIds.rayon) formData.append(entryIds.rayon, rayon);
        if (entryIds.phone) formData.append(entryIds.phone, phone);

        await fetch(googleFormUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });
      }

      // 2. Send WhatsApp via Fonnte
      const fonnteToken = process.env.FONNTE_TOKEN;
      
      // Bersihkan nomor HP (hanya angka)
      const cleanPhone = phone.replace(/\D/g, '');

      let whatsappStatus = { success: true, error: null };

      if (fonnteToken && cleanPhone) {
        console.log(`Attempting to send WhatsApp to: ${cleanPhone}`);
        
        try {
          const fonnteResponse = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
              Authorization: fonnteToken,
            },
            body: new URLSearchParams({
              target: cleanPhone,
              message: `Halo ${name},\n\nTerima kasih telah mendaftar di zito studio.\n\nData Anda:\nNIK: ${nik}\nAlamat: ${address}\nRayon: ${rayon}\n\nKami akan segera menghubungi Anda.`,
            }),
          });

          const fonnteData = await fonnteResponse.json();
          console.log("Fonnte API Response:", fonnteData);

          if (!fonnteData.status) {
            let errorMessage = fonnteData.reason || "Unknown Fonnte error";
            
            // Handle specific "disconnected device" error from Fonnte
            if (errorMessage.toLowerCase().includes("disconnected device")) {
              errorMessage = "Perangkat WhatsApp di Fonnte terputus. Silakan hubungkan ulang perangkat Anda di dashboard Fonnte.";
            }

            whatsappStatus = { 
              success: false, 
              error: errorMessage 
            };
            console.error("Fonnte Error Details:", errorMessage);
          }
        } catch (err) {
          whatsappStatus = { success: false, error: "Network error calling Fonnte" };
          console.error("Fonnte Network Error:", err);
        }
      } else {
        if (!fonnteToken) {
          whatsappStatus = { success: false, error: "FONNTE_TOKEN is missing" };
        } else if (!cleanPhone) {
          whatsappStatus = { success: false, error: "Invalid phone number" };
        }
      }

      res.json({ 
        success: true, 
        message: "Data berhasil disimpan di Google Sheets.",
        whatsapp: whatsappStatus
      });
    } catch (error) {
      console.error("Submission Error:", error);
      res.status(500).json({ success: false, error: "Failed to submit form." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running as a serverless function (Vercel)
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};

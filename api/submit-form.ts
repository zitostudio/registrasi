import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const cleanPhone = phone.replace(/\D/g, '');

    let whatsappStatus = { success: true, error: null };

    if (fonnteToken && cleanPhone) {
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

        if (!fonnteData.status) {
          let errorMessage = fonnteData.reason || "Unknown Fonnte error";
          if (errorMessage.toLowerCase().includes("disconnected device")) {
            errorMessage = "Perangkat WhatsApp di Fonnte terputus. Silakan hubungkan ulang perangkat Anda di dashboard Fonnte.";
          }
          whatsappStatus = { success: false, error: errorMessage };
        }
      } catch (err) {
        whatsappStatus = { success: false, error: "Network error calling Fonnte" };
      }
    } else {
      whatsappStatus = { 
        success: false, 
        error: !fonnteToken ? "FONNTE_TOKEN is missing" : "Invalid phone number" 
      };
    }

    return res.json({ 
      success: true, 
      message: "Data berhasil disimpan.",
      whatsapp: whatsappStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to submit form." });
  }
}

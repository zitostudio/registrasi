import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  CheckCircle2, 
  Phone, 
  User, 
  IdCard, 
  MapPin, 
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    address: "",
    rayon: "",
    phone: "",
  });

  // Integration Settings (Hardcoded as requested)
  const [settings] = useState({
    googleFormId: "1FAIpQLSfxT6qbSNcoPFK6-aVMMbPTWexthLtuRdDABk9vGafYqAcSmA",
    entryName: "entry.1392925352", 
    entryNik: "entry.102822586",
    entryAddress: "entry.662910828",
    entryRayon: "entry.566356924",
    entryPhone: "entry.404505507",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nik || !formData.address || !formData.rayon || !formData.phone) {
      toast.error("Harap isi semua field!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          googleFormId: settings.googleFormId,
          entryIds: {
            name: settings.entryName,
            nik: settings.entryNik,
            address: settings.entryAddress,
            rayon: settings.entryRayon,
            phone: settings.entryPhone,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.whatsapp && !data.whatsapp.success) {
          const isDisconnected = 
            data.whatsapp.error.toLowerCase().includes("disconnected device") || 
            data.whatsapp.error.toLowerCase().includes("terputus");

          if (isDisconnected) {
            toast.error(
              "WhatsApp Gagal: Perangkat Fonnte Terputus. Silakan hubungkan ulang WhatsApp Anda di Dashboard Fonnte.",
              {
                duration: 6000,
                action: {
                  label: "Buka Fonnte",
                  onClick: () => window.open("https://channa.fonnte.com/dashboard", "_blank")
                },
              }
            );
          } else {
            toast.warning(`Data tersimpan, namun WhatsApp gagal: ${data.whatsapp.error}`);
          }
        } else {
          toast.success("Pendaftaran berhasil dikirim!");
        }
        setSubmitted(true);
        setFormData({ name: "", nik: "", address: "", rayon: "", phone: "" });
      } else {
        toast.error(data.error || "Gagal mengirim formulir.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <Toaster position="top-center" theme="dark" />
      
      <main className="flex-1 flex items-center justify-center p-4 py-12 relative z-10">
        <div className="w-full max-w-md relative">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <Card className="border-blue-500/20 bg-slate-900/80 backdrop-blur-xl p-8 flex flex-col items-center gap-6 shadow-2xl shadow-blue-500/10">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl text-white">Berhasil Terkirim!</CardTitle>
                    <CardDescription className="text-slate-400">
                      Terima kasih. Data Anda telah kami terima dan notifikasi WhatsApp telah dikirim.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Kirim Pesan Lain
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                  <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-2xl font-bold text-white">pendaftaran</CardTitle>
                    <CardDescription className="text-slate-400">
                      Silakan isi data di bawah untuk mendaftar.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-300">Nama Lengkap</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <Input 
                            id="name" 
                            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                            placeholder="Nama Lengkap" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nik" className="text-sm font-medium text-slate-300">No NIK KTP</Label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <Input 
                            id="nik" 
                            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                            placeholder="Masukkan 16 digit NIK" 
                            value={formData.nik}
                            onChange={(e) => setFormData({...formData, nik: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium text-slate-300">Alamat</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <Input 
                            id="address" 
                            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                            placeholder="Alamat Lengkap" 
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rayon" className="text-sm font-medium text-slate-300">Lokal Rayon</Label>
                        <div className="relative">
                          <Map className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <Input 
                            id="rayon" 
                            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                            placeholder="Nama Lokal Rayon" 
                            value={formData.rayon}
                            onChange={(e) => setFormData({...formData, rayon: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-300">Nomor WhatsApp ( diawali dengan 62 )</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <Input 
                            id="phone" 
                            type="tel" 
                            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                            placeholder="628123456789" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-8">
                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Mengirim...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Kirim Pesan <Send className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <footer className="py-6 text-center text-slate-500 text-xs relative z-10">
        &copy; {new Date().getFullYear()} zito studio
      </footer>
    </div>
  );
}

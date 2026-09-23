import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Package, ChartLine } from "lucide-react";

const CATEGORIES = [
  "Kuliner & Kedai Kopi",
  "Retail & Kelontong",
  "Fashion",
  "Jasa",
  "Bisnis Rumahan",
  "Lainnya",
];

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    owner_name: "",
    business_name: "",
    business_category: "",
    phone: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Selamat datang kembali!");
      } else {
        await register(form);
        toast.success("Akun berhasil dibuat! Selamat bergabung.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const demoFill = () => {
    setMode("register");
    setForm({
      email: "",
      password: "",
      owner_name: "Rifa Zaki",
      business_name: "Warkop Kopi Nadi Nusantara",
      business_category: "",
      phone: "081234567890",
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50">
      {/* Left: Brand */}
      <div className="hidden lg:flex relative bg-emerald-800 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-40" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 rounded-full bg-emerald-600/40 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500 grid place-items-center font-bold text-2xl text-emerald-900">N</div>
          <div>
            <div className="text-xl font-bold">NADI</div>
            <div className="text-xs uppercase tracking-widest opacity-70">Navigasi Data Bisnis</div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Catat transaksi.<br />
            Pahami data.<br />
            <span className="text-amber-400">Ambil keputusan lebih cerdas.</span>
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Asisten bisnis digital untuk UMKM Indonesia. Dari warung kopi hingga toko kelontong.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
            {[
              { icon: TrendingUp, t: "Analitik Sederhana" },
              { icon: Sparkles, t: "Rekomendasi AI" },
              { icon: Package, t: "Kelola Stok" },
              { icon: ChartLine, t: "Laporan Otomatis" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2.5 text-sm">
                <div className="h-8 w-8 rounded-lg bg-white/10 grid place-items-center">
                  <f.icon size={16} className="text-amber-400" />
                </div>
                <span>{f.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs opacity-60">© 2026 NADI · Untuk UMKM Indonesia</div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-800 grid place-items-center text-white font-bold text-xl">N</div>
            <div>
              <div className="font-bold text-stone-900">NADI</div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">Navigasi Data Bisnis</div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
            {mode === "login" ? "Masuk ke NADI" : "Daftarkan UMKM Anda"}
          </h2>
          <p className="text-stone-500 mb-6 text-sm">
            {mode === "login" ? "Kelola bisnis Anda dengan lebih cerdas" : "Gratis untuk memulai. Tanpa kartu kredit."}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1 block">Nama Pemilik</label>
                  <input
                    required
                    data-testid="reg-owner-input"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 outline-none"
                    placeholder="cth. Rifa Zaki"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1 block">Nama Usaha</label>
                  <input
                    required
                    data-testid="reg-business-input"
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 outline-none"
                    placeholder="cth. Warkop Kopi Nusantara"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1 block">Kategori Usaha</label>
                  <select
                    data-testid="reg-category-select"
                    value={form.business_category}
                    onChange={(e) => setForm({ ...form, business_category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Email</label>
              <input
                required
                type="email"
                data-testid="login-email-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 outline-none"
                placeholder="email@usaha.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Kata Sandi</label>
              <input
                required
                type="password"
                data-testid="login-password-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="submit-btn"
              className="w-full py-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-stone-600">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              data-testid="switch-mode-btn"
              className="text-emerald-800 font-semibold hover:underline"
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </div>

          {mode === "register" && (
            <button
              type="button"
              onClick={demoFill}
              data-testid="demo-fill-btn"
              className="mt-6 w-full py-2.5 rounded-lg border border-amber-500/50 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              ✨ Isi otomatis Demo Kedai Kopi Nadi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

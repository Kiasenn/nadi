import React, { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Store, Crown, Save } from "lucide-react";

const CATEGORIES = ["Kuliner & Kedai Kopi", "Retail & Kelontong", "Fashion", "Jasa", "Bisnis Rumahan", "Lainnya"];

export default function Profil() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    business_name: user?.business_name || "",
    business_category: user?.business_category || "",
    owner_name: user?.owner_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    operating_hours: user?.operating_hours || "08:00 - 22:00",
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      await refreshUser();
      toast.success("Profil bisnis diperbarui");
    } catch {
      toast.error("Gagal memperbarui");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl" data-testid="profil-page">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Profil Bisnis</h1>
        <p className="text-sm text-stone-500">Kelola informasi usaha & paket berlangganan</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-emerald-800 text-white p-6 shadow-md">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4 flex-wrap">
          <div className="h-16 w-16 rounded-2xl bg-amber-500 grid place-items-center text-emerald-900 shrink-0">
            <Store size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold">Usaha Anda</div>
            <div className="text-2xl font-bold truncate">{user?.business_name}</div>
            <div className="text-sm opacity-80">{user?.business_category} · {user?.email}</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20">
            <Crown size={14} className="text-amber-400" />
            <span className="text-sm font-semibold">{user?.subscription_plan || "Starter"}</span>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h3 className="font-semibold text-stone-900">Informasi Usaha</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Nama Usaha</label>
            <input required data-testid="profile-business-name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Kategori</label>
            <select value={form.business_category} onChange={(e) => setForm({ ...form, business_category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Nama Pemilik</label>
            <input required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Nomor HP / WA</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-stone-600 block mb-1">Alamat Usaha</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm" placeholder="Jl. Contoh No. 1, Jakarta" />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Jam Operasional</label>
            <input value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm" placeholder="08:00 - 22:00" />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Email</label>
            <input disabled value={user?.email || ""} className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-500" />
          </div>
        </div>
        <button type="submit" disabled={saving} data-testid="profile-save" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold disabled:opacity-60">
          <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Starter", price: "Gratis", features: ["POS Kasir", "Hingga 50 produk", "Laporan dasar"], current: user?.subscription_plan === "Starter" },
          { name: "Growth", price: "Rp99rb/bln", features: ["Semua fitur Starter", "AI Insight Unlimited", "Produk tanpa batas", "Laporan lengkap"], current: user?.subscription_plan === "Growth", popular: true },
          { name: "Business", price: "Rp249rb/bln", features: ["Semua fitur Growth", "Multi cabang", "API akses", "Priority support"], current: user?.subscription_plan === "Business" },
        ].map((plan) => (
          <div key={plan.name} className={`rounded-2xl border p-5 ${plan.popular ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20" : "border-stone-200 bg-white"}`}>
            {plan.popular && <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Paling Populer</div>}
            <div className="font-bold text-lg text-stone-900">{plan.name}</div>
            <div className="text-2xl font-bold text-emerald-800 font-mono-num my-2">{plan.price}</div>
            <ul className="space-y-1.5 text-sm text-stone-600 mb-4">
              {plan.features.map(f => <li key={f} className="flex gap-2"><span className="text-emerald-700">✓</span>{f}</li>)}
            </ul>
            <button disabled={plan.current} className={`w-full py-2 rounded-lg text-sm font-semibold ${plan.current ? "bg-stone-100 text-stone-500" : plan.popular ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-emerald-800 hover:bg-emerald-900 text-white"}`}>
              {plan.current ? "Paket Aktif" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

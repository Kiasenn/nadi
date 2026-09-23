import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Sparkles, TrendingUp, Clock, AlertTriangle, Calendar, PieChart, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const ICONS = { TrendingUp, Clock, AlertTriangle, Calendar, PieChart };

export default function Insight() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/insights");
      setData(data);
    } catch {
      toast.error("Gagal memuat insight");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5" data-testid="insight-page">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Sparkles size={12} /> Powered by AI
          </div>
          <h1 className="text-2xl font-bold text-stone-900">NADI Insight</h1>
          <p className="text-sm text-stone-500">Rekomendasi cerdas berdasarkan data bisnis Anda</p>
        </div>
        <button onClick={load} disabled={loading} data-testid="refresh-insight" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-sm font-medium">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* AI Summary Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-emerald-800 text-white p-6 shadow-md">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-emerald-600/40 blur-3xl" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500 grid place-items-center shrink-0">
            <Sparkles size={22} className="text-emerald-900" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-2">Ringkasan NADI</div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-white/20 rounded animate-pulse" />
              </div>
            ) : (
              <div className="text-base leading-relaxed whitespace-pre-line" data-testid="ai-summary">
                {data?.ai_summary || "Halo! Saya NADI, asisten bisnis Anda. Terus catat transaksi Anda dan saya akan berikan rekomendasi cerdas untuk pertumbuhan usaha."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {(data?.insights || []).map((ins, idx) => {
          const Icon = ICONS[ins.icon] || Sparkles;
          const isWarning = ins.type === "low_stock";
          return (
            <div key={idx} data-testid={`insight-card-${idx}`} className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${isWarning ? "border-red-200" : "border-stone-200"}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${isWarning ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-800"}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-900 leading-tight">{ins.title}</h4>
                </div>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed mb-3">{ins.message}</p>
              {ins.action && (
                <div className="pt-3 border-t border-stone-100 flex items-start gap-2 text-sm">
                  <div className="text-amber-600 font-semibold shrink-0">💡 Saran:</div>
                  <div className="text-stone-700">{ins.action}</div>
                </div>
              )}
            </div>
          );
        })}
        {!loading && (!data?.insights || data.insights.length === 0) && (
          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
            Belum cukup data untuk membuat insight. Catat beberapa transaksi terlebih dahulu!
          </div>
        )}
      </div>
    </div>
  );
}

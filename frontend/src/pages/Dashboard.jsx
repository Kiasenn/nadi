import React, { useEffect, useState } from "react";
import { api, formatRp, formatDateTime } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  TrendingUp, Wallet, ShoppingBag, Award, AlertTriangle, Sparkles, ArrowRight, Zap
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from "recharts";
import { useNavigate } from "react-router-dom";

const StatCard = ({ icon: Icon, label, value, accent, testid }) => (
  <div data-testid={testid} className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
    <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">{label}</div>
    <div className="text-2xl font-bold text-stone-900 font-mono-num mt-1">{value}</div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/dashboard/summary");
      setData(data);
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      await api.post("/seed/demo");
      toast.success("Data demo berhasil dimuat!");
      await load();
    } catch (e) {
      toast.error("Gagal memuat data demo");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="text-stone-500">Memuat dashboard...</div>;

const dashboardData = data || {
  today_revenue: 0,
  today_profit: 0,
  today_count: 0,
  best_product: null,
  chart_7d: [],
  low_stock: [],
  recent_transactions: []
};

const isEmpty = !dashboardData.chart_7d.some(d => d.revenue > 0);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-stone-500">Selamat datang kembali,</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900" data-testid="dashboard-greeting">
            {user?.owner_name} 👋
          </h1>
          <div className="text-sm text-stone-600 mt-0.5">{user?.business_name}</div>
        </div>
        {isEmpty && (
          <button
            onClick={seedDemo}
            disabled={seeding}
            data-testid="seed-demo-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Zap size={16} />
            {seeding ? "Memuat data..." : "Muat Data Demo 30 Hari"}
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
       <StatCard testid="kpi-revenue" icon={Wallet} label="Omzet Hari Ini" value={formatRp(dashboardData.today_revenue)} accent="bg-emerald-50 text-emerald-800" />
       <StatCard testid="kpi-profit" icon={TrendingUp} label="Est. Keuntungan" value={formatRp(dashboardData.today_profit)} accent="bg-amber-50 text-amber-700" />
       <StatCard testid="kpi-count" icon={ShoppingBag} label="Transaksi" value={dashboardData.today_count} accent="bg-blue-50 text-blue-700" />
       <StatCard testid="kpi-best" icon={Award} label="Terlaris" value={dashboardData.best_product?.name?.split(" ").slice(0,2).join(" ") || "-"} accent="bg-purple-50 text-purple-700" />
      </div>

      {/* Chart + Alerts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-stone-900">Grafik Penjualan 7 Hari</h3>
              <p className="text-xs text-stone-500">Tren omzet dan keuntungan mingguan</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.chart_7d}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F5132" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0F5132" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="#78716C" />
                <YAxis fontSize={11} stroke="#78716C" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => formatRp(v)}
                  labelFormatter={(l) => `Tanggal: ${l}`}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }}
                />
                <Area type="monotone" dataKey="revenue" name="Omzet" stroke="#0F5132" strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="profit" name="Keuntungan" stroke="#D97706" strokeWidth={2} fill="url(#prof)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 grid place-items-center">
              <AlertTriangle size={16} />
            </div>
            <h3 className="font-semibold text-stone-900">Stok Menipis</h3>
          </div>
          {dashboardData.low_stock.length === 0 ? (
            <div className="text-sm text-stone-500 py-8 text-center">Semua stok aman ✨</div>
          ) : (
            <div className="space-y-2">
              {dashboardData.low_stock.slice(0, 5).map((p) => (
                <div key={p.id} data-testid={`low-stock-${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-900 truncate">{p.name}</div>
                    <div className="text-xs text-stone-500">Min: {p.min_stock} {p.unit}</div>
                  </div>
                  <div className="text-sm font-bold text-red-600 font-mono-num">{p.stock}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insight banner */}
      <div className="relative overflow-hidden rounded-2xl bg-emerald-800 text-white p-6 shadow-md">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex gap-3 items-start">
            <div className="h-11 w-11 rounded-xl bg-amber-500 grid place-items-center shrink-0">
              <Sparkles size={20} className="text-emerald-900" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-1">Rekomendasi NADI</div>
              <div className="text-lg font-semibold max-w-xl">
                {dashboardData.best_product
                  ? `${dashboardData.best_product.name} sedang jadi primadona minggu ini. Pertimbangkan buat paket bundling untuk naikkan omzet!`
                  : "Mulai catat transaksi pertama Anda untuk melihat rekomendasi cerdas dari NADI."}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/insight")}
            data-testid="dashboard-view-insight"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-emerald-900 text-sm font-semibold hover:bg-amber-50 transition-colors"
          >
            Lihat Semua Insight <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex justify-between items-center">
          <h3 className="font-semibold text-stone-900">Transaksi Terbaru</h3>
          <button onClick={() => navigate("/transaksi")} className="text-sm text-emerald-800 font-medium hover:underline">Lihat semua</button>
        </div>
        {dashboardData.recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">Belum ada transaksi.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {dashboardData.recent_transactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-900 truncate">
                    {t.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{formatDateTime(t.created_at)} · {t.payment_method}</div>
                </div>
                <div className="text-sm font-bold text-stone-900 font-mono-num">{formatRp(t.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

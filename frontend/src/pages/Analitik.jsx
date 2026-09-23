import React, { useEffect, useState } from "react";
import { api, formatRp } from "@/lib/api";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#0F5132", "#D97706", "#2563EB", "#DC2626", "#7C3AED", "#0891B2"];

export default function Analitik() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.get(`/analytics/overview?days=${days}`).then(r => setData(r.data));
  }, [days]);

  if (!data) return <div className="text-stone-500">Memuat...</div>;

  return (
    <div className="space-y-5" data-testid="analitik-page">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Analitik Bisnis</h1>
          <p className="text-sm text-stone-500">Pahami performa bisnis dengan visual sederhana</p>
        </div>
        <div className="flex gap-1 bg-white rounded-lg border border-stone-200 p-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} data-testid={`period-${d}`} className={`px-3 py-1.5 text-xs font-medium rounded-md ${days === d ? "bg-emerald-800 text-white" : "text-stone-600"}`}>{d} hari</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Total Omzet", v: formatRp(data.total_revenue), c: "text-emerald-800" },
          { l: "Total Keuntungan", v: formatRp(data.total_profit), c: "text-amber-700" },
          { l: "Transaksi", v: data.total_trx, c: "text-blue-700" },
          { l: "Avg. Ticket", v: formatRp(data.avg_ticket), c: "text-purple-700" },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">{k.l}</div>
            <div className={`text-2xl font-bold font-mono-num mt-1 ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-900 mb-1">Tren Pendapatan & Keuntungan</h3>
        <p className="text-xs text-stone-500 mb-4">Perbandingan omzet vs keuntungan harian</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="#78716C" />
              <YAxis fontSize={11} stroke="#78716C" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatRp(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Omzet" stroke="#0F5132" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="profit" name="Keuntungan" stroke="#D97706" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-900 mb-1">Penjualan per Jam</h3>
          <p className="text-xs text-stone-500 mb-4">Kenali jam ramai bisnis Anda</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="hour" fontSize={10} stroke="#78716C" />
                <YAxis fontSize={11} stroke="#78716C" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatRp(v)} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#0F5132" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-900 mb-1">Penjualan per Hari</h3>
          <p className="text-xs text-stone-500 mb-4">Hari paling laris dalam seminggu</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="day" fontSize={11} stroke="#78716C" />
                <YAxis fontSize={11} stroke="#78716C" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatRp(v)} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-900 mb-1">Kontribusi Kategori</h3>
          <p className="text-xs text-stone-500 mb-4">Kategori penyumbang omzet terbesar</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categories} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                  {data.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRp(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-900 mb-1">Top 10 Produk</h3>
          <p className="text-xs text-stone-500 mb-4">Produk paling laris</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.top_products.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50">
                <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-900 truncate">{p.name}</div>
                  <div className="text-xs text-stone-500 font-mono-num">{p.quantity} terjual</div>
                </div>
                <div className="text-sm font-bold text-emerald-800 font-mono-num">{formatRp(p.revenue)}</div>
              </div>
            ))}
            {data.top_products.length === 0 && <div className="text-center py-8 text-stone-500 text-sm">Belum ada data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

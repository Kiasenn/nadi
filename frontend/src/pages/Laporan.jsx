import React, { useEffect, useState } from "react";
import { api, formatRp, formatDate } from "@/lib/api";
import { Download, Printer, FileText } from "lucide-react";
import { toast } from "sonner";

const PERIODS = [
  { key: "daily", label: "Harian" },
  { key: "weekly", label: "Mingguan" },
  { key: "monthly", label: "Bulanan" },
];

export default function Laporan() {
  const [period, setPeriod] = useState("weekly");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/reports?period=${period}`).then(r => setData(r.data));
  }, [period]);

  const printReport = () => window.print();

  const downloadCSV = () => {
    if (!data) return;
    const rows = [
      ["Laporan Penjualan", PERIODS.find(p => p.key === period)?.label],
      ["Periode (hari)", data.days],
      ["Total Omzet", data.total_revenue],
      ["Total Pengeluaran", data.total_pengeluaran],
      ["Total Keuntungan", data.total_profit],
      ["Jumlah Transaksi", data.total_trx],
      [],
      ["Produk", "Terjual", "Omzet"],
      ...data.products.map(p => [p.name, p.quantity, p.revenue]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-nadi-${period}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success("Laporan diunduh");
  };

  if (!data) return <div className="text-stone-500">Memuat...</div>;

  return (
    <div className="space-y-5" data-testid="laporan-page">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Laporan Bisnis</h1>
          <p className="text-sm text-stone-500">Ringkasan performa untuk pengambilan keputusan</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm hover:bg-stone-50">
            <Printer size={14} /> Cetak
          </button>
          <button onClick={downloadCSV} data-testid="download-report" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900">
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-lg border border-stone-200 p-1 w-fit">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            data-testid={`period-${p.key}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-md ${period === p.key ? "bg-emerald-800 text-white" : "text-stone-600 hover:bg-stone-50"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div id="report-content" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <FileText size={14} />
              <span className="text-xs uppercase tracking-widest font-semibold">Laporan {PERIODS.find(p => p.key === period)?.label}</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900">Ringkasan Penjualan</h2>
            <p className="text-xs text-stone-500 mt-1">Periode: {data.days} hari terakhir · Dicetak {formatDate(new Date().toISOString())}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-800 text-white grid place-items-center font-bold text-xl">N</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Total Omzet", v: formatRp(data.total_revenue), c: "text-emerald-800", bg: "bg-emerald-50" },
            { l: "Total Pengeluaran", v: formatRp(data.total_pengeluaran), c: "text-stone-700", bg: "bg-stone-50" },
            { l: "Keuntungan Bersih", v: formatRp(data.total_profit), c: "text-amber-700", bg: "bg-amber-50" },
            { l: "Transaksi", v: data.total_trx, c: "text-blue-700", bg: "bg-blue-50" },
          ].map((k, i) => (
            <div key={i} className={`rounded-xl p-4 ${k.bg}`}>
              <div className="text-xs text-stone-600 font-medium">{k.l}</div>
              <div className={`text-lg font-bold font-mono-num mt-1 ${k.c}`}>{k.v}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold text-stone-900 mb-3">Laba Rugi Sederhana</h3>
          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Pendapatan Kotor</span>
              <span className="font-mono-num font-semibold">{formatRp(data.total_revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">(-) Harga Pengeluaran</span>
              <span className="font-mono-num text-red-600">-{formatRp(data.total_pengeluaran)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-300 pt-2 font-bold">
              <span>Laba Bersih</span>
              <span className="font-mono-num text-emerald-800">{formatRp(data.total_profit)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-stone-900 mb-3">Performa Produk</h3>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-stone-500 border-b border-stone-200">
              <tr>
                <th className="text-left py-2">Produk</th>
                <th className="text-right py-2">Terjual</th>
                <th className="text-right py-2">Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.products.slice(0, 15).map((p, i) => (
                <tr key={i}>
                  <td className="py-2.5">{p.name}</td>
                  <td className="text-right font-mono-num">{p.quantity}</td>
                  <td className="text-right font-mono-num font-semibold">{formatRp(p.revenue)}</td>
                </tr>
              ))}
              {data.products.length === 0 && <tr><td colSpan="3" className="text-center py-8 text-stone-500">Belum ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

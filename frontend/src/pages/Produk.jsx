import React, { useEffect, useState } from "react";
import { api, formatRp } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Package, AlertTriangle, Edit2, Trash2, X } from "lucide-react";

const emptyForm = { name: "", category: "Minuman", price: 0, hpp: 0, stock: 0, unit: "pcs", min_stock: 10, image: "" };

export default function Produk() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showLowOnly, setShowLowOnly] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/products"); setProducts(data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price), hpp: Number(form.hpp), stock: Number(form.stock), min_stock: Number(form.min_stock) };
      if (editing) await api.put(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan");
      setModal(false); await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan");
    }
  };

  const remove = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Produk dihapus");
    await load();
  };

  const list = showLowOnly ? products.filter(p => p.stock <= p.min_stock) : products;
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowCount = products.filter(p => p.stock <= p.min_stock).length;

  if (loading) return <div className="text-stone-500">Memuat...</div>;

  const margin = form.price > 0 ? (((form.price - form.hpp) / form.price) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5" data-testid="produk-page">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Produk & Stok</h1>
          <p className="text-sm text-stone-500">Kelola katalog produk dan pantau stok</p>
        </div>
        <button onClick={openAdd} data-testid="add-product-btn" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide">Total Produk</div>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono-num">{products.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide">Nilai Inventaris</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono-num">{formatRp(totalValue)}</div>
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          data-testid="low-stock-toggle"
          className={`text-left rounded-xl border p-4 transition-colors ${showLowOnly ? "bg-red-50 border-red-200" : "bg-white border-stone-200 hover:bg-red-50/40"}`}
        >
          <div className="text-xs text-stone-500 uppercase tracking-wide flex items-center gap-1"><AlertTriangle size={12} /> Stok Menipis</div>
          <div className="text-2xl font-bold text-red-600 mt-1 font-mono-num">{lowCount}</div>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">Produk</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Kategori</th>
              <th className="text-right px-4 py-3">Harga</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">HPP</th>
              <th className="text-right px-4 py-3">Stok</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map(p => (
              <tr key={p.id} data-testid={`product-row-${p.id}`} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image ? <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-stone-100 grid place-items-center"><Package size={16} className="text-stone-400" /></div>}
                    <div className="font-medium text-stone-900">{p.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell"><span className="px-2 py-0.5 rounded-full bg-stone-100 text-xs">{p.category}</span></td>
                <td className="px-4 py-3 text-right font-mono-num font-semibold">{formatRp(p.price)}</td>
                <td className="px-4 py-3 text-right font-mono-num text-stone-500 hidden md:table-cell">{formatRp(p.hpp)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono-num font-semibold ${p.stock <= p.min_stock ? "text-red-600" : "text-stone-900"}`}>{p.stock}</span>
                  <span className="text-xs text-stone-400 ml-1">{p.unit}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(p)} data-testid={`edit-${p.id}`} className="p-1.5 hover:bg-stone-100 rounded"><Edit2 size={14} /></button>
                    <button onClick={() => remove(p.id)} data-testid={`delete-${p.id}`} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="text-center py-12 text-stone-500">Tidak ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setModal(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button type="button" onClick={() => setModal(false)} className="absolute top-3 right-3 text-stone-400"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-4">{editing ? "Ubah Produk" : "Tambah Produk"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Nama Produk</label>
                <input required data-testid="prod-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Kategori</label>
                  <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Satuan</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Harga Jual (Rp)</label>
                  <input required type="number" data-testid="prod-price-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono-num" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">HPP (Rp)</label>
                  <input required type="number" value={form.hpp} onChange={(e) => setForm({ ...form, hpp: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono-num" />
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs">Margin: <span className="font-bold font-mono-num">{margin}%</span></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Stok Awal</label>
                  <input required type="number" data-testid="prod-stock-input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono-num" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Min. Stok</label>
                  <input required type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono-num" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">URL Gambar (opsional)</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" placeholder="https://..." />
              </div>
            </div>
            <button type="submit" data-testid="prod-save-btn" className="w-full mt-5 py-2.5 rounded-lg bg-emerald-800 text-white font-semibold text-sm">Simpan Produk</button>
          </form>
        </div>
      )}
    </div>
  );
}

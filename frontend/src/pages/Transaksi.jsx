import React, { useEffect, useState, useMemo } from "react";
import { api, formatRp, formatDateTime } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingCart, Search, X, CheckCircle2, Filter } from "lucide-react";

export default function Transaksi() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState("Tunai");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [tab, setTab] = useState("kasir");

  const load = async () => {
    try {
      const [p, t] = await Promise.all([api.get("/products"), api.get("/transactions")]);
      setProducts(p.data);
      setTransactions(t.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => ["Semua", ...new Set(products.map(p => p.category))], [products]);
  const filtered = products.filter(p =>
    (category === "Semua" || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (p) => {
    if (p.stock <= 0) { toast.error("Stok habis"); return; }
    setCart(prev => {
      const found = prev.find(c => c.product_id === p.id);
      if (found) {
        if (found.quantity >= p.stock) { toast.error("Melebihi stok"); return prev; }
        return prev.map(c => c.product_id === p.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product_id: p.id, name: p.name, price: p.price, quantity: 1, stock: p.stock }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.product_id === id) {
        const q = c.quantity + delta;
        if (q <= 0) return null;
        if (q > c.stock) { toast.error("Melebihi stok"); return c; }
        return { ...c, quantity: q };
      }
      return c;
    }).filter(Boolean));
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c.product_id !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const { data } = await api.post("/transactions", {
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
        payment_method: payment,
        discount: 0,
      });
      setReceipt(data);
      setCart([]);
      toast.success("Pembayaran berhasil!");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal memproses");
    } finally {
      setProcessing(false);
    }
  };

  const historyFiltered = transactions.filter(t => {
    if (!dateFilter) return true;
    return t.created_at.startsWith(dateFilter);
  });

  if (loading) return <div className="text-stone-500">Memuat...</div>;

  return (
    <div className="space-y-4" data-testid="transaksi-page">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Transaksi</h1>
        <p className="text-sm text-stone-500">Kasir cepat & riwayat transaksi</p>
      </div>

      <div className="flex gap-1 border-b border-stone-200">
        <button onClick={() => setTab("kasir")} data-testid="tab-kasir" className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "kasir" ? "border-emerald-800 text-emerald-800" : "border-transparent text-stone-500"}`}>Kasir</button>
        <button onClick={() => setTab("riwayat")} data-testid="tab-riwayat" className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "riwayat" ? "border-emerald-800 text-emerald-800" : "border-transparent text-stone-500"}`}>Riwayat</button>
      </div>

      {tab === "kasir" && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Product grid */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  data-testid="product-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 outline-none"
                />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(p => (
                <button
                  key={p.id}
                  data-testid={`product-tile-${p.id}`}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="text-left bg-white rounded-xl border border-stone-200 p-3 hover:border-emerald-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {p.image && <div className="h-24 rounded-lg bg-stone-100 mb-2 overflow-hidden"><img src={p.image} alt={p.name} className="w-full h-full object-cover" /></div>}
                  <div className="text-sm font-semibold text-stone-900 line-clamp-2">{p.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{p.category}</div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="text-sm font-bold text-emerald-800 font-mono-num">{formatRp(p.price)}</div>
                    <div className={`text-xs font-medium ${p.stock <= p.min_stock ? "text-red-600" : "text-stone-500"}`}>Stok: {p.stock}</div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center py-12 text-stone-500 text-sm">Produk tidak ditemukan</div>}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:sticky lg:top-4 lg:self-start bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={18} className="text-emerald-800" />
              <h3 className="font-semibold text-stone-900">Keranjang ({cart.length})</h3>
            </div>
            {cart.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">Klik produk untuk menambahkan</div>
            ) : (
              <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
                {cart.map(c => (
                  <div key={c.product_id} data-testid={`cart-item-${c.product_id}`} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-900 truncate">{c.name}</div>
                      <div className="text-xs text-stone-500 font-mono-num">{formatRp(c.price)}</div>
                    </div>
                    <button onClick={() => updateQty(c.product_id, -1)} className="h-7 w-7 rounded-md bg-white border border-stone-200 grid place-items-center hover:bg-stone-100"><Minus size={12} /></button>
                    <div className="w-6 text-center text-sm font-semibold">{c.quantity}</div>
                    <button onClick={() => updateQty(c.product_id, 1)} data-testid={`cart-plus-${c.product_id}`} className="h-7 w-7 rounded-md bg-white border border-stone-200 grid place-items-center hover:bg-stone-100"><Plus size={12} /></button>
                    <button onClick={() => removeItem(c.product_id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-stone-200">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-mono-num font-semibold">{formatRp(subtotal)}</span>
              </div>
              <div className="flex gap-1 my-3">
                {["Tunai", "QRIS", "Transfer"].map(m => (
                  <button key={m} onClick={() => setPayment(m)} data-testid={`pay-${m}`} className={`flex-1 py-1.5 rounded-md text-xs font-medium ${payment === m ? "bg-emerald-800 text-white" : "bg-stone-100 text-stone-600"}`}>{m}</button>
                ))}
              </div>
              <button
                onClick={checkout}
                disabled={cart.length === 0 || processing}
                data-testid="checkout-btn"
                className="w-full py-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {processing ? "Memproses..." : `Bayar ${formatRp(subtotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "riwayat" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-stone-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              data-testid="date-filter"
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm"
            />
            {dateFilter && <button onClick={() => setDateFilter("")} className="text-sm text-stone-500 hover:text-stone-900">Reset</button>}
            <div className="ml-auto text-sm text-stone-500">{historyFiltered.length} transaksi</div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {historyFiltered.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm">Belum ada transaksi</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {historyFiltered.slice(0, 100).map(t => (
                  <div key={t.id} data-testid={`history-${t.id}`} className="p-4 hover:bg-stone-50">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-stone-900">
                          {t.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                        </div>
                        <div className="text-xs text-stone-500 mt-1">{formatDateTime(t.created_at)} · {t.payment_method}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-stone-900 font-mono-num">{formatRp(t.total)}</div>
                        <div className="text-xs text-emerald-700 font-mono-num">+{formatRp(t.profit)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setReceipt(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setReceipt(null)} className="absolute top-3 right-3 text-stone-400 hover:text-stone-900"><X size={18} /></button>
            <div className="text-center mb-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-2">
                <CheckCircle2 size={28} className="text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900">Pembayaran Berhasil</h3>
              <p className="text-xs text-stone-500 font-mono">{receipt.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="space-y-1 text-sm border-y border-dashed border-stone-200 py-3 mb-3">
              {receipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-stone-700">{i.name} × {i.quantity}</span>
                  <span className="font-mono-num">{formatRp(i.total)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono-num text-emerald-800">{formatRp(receipt.total)}</span>
            </div>
            <div className="text-center text-xs text-stone-500 mt-4">Terima kasih! · {receipt.payment_method}</div>
          </div>
        </div>
      )}
    </div>
  );
}

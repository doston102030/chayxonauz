"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  TrendingUp,
  Package,
  Flame,
  History,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  ShoppingBag,
  Award,
  BarChart2,
  ChevronRight,
  ImagePlus,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatSom, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Stats = {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  totalService: number;
  products: { name: string; quantity: number; revenue: number; category: string }[];
  categories: { name: string; revenue: number; quantity: number }[];
  tables: { name: string; zone: string; orders: number; revenue: number }[];
  shashlik: { productName: string; tableName: string; quantity: number; revenue: number; time: string }[];
  chartData: { label: string; value: number }[];
};

type Product = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  isWeighted: boolean;
  unit: string;
  isActive: boolean;
  emoji: string;
  imageUrl?: string;
};

type Category = {
  id: number;
  name: string;
  icon: string;
  products: Product[];
};

const PIE_COLORS = ["#059669", "#d97706", "#0891b2", "#7c3aed", "#dc2626", "#0d9488"];

const TABS = [
  { id: "stats",    label: "Hisobot",  icon: TrendingUp },
  { id: "products", label: "Menyu",    icon: Package    },
  { id: "shashlik", label: "Shashlik", icon: Flame      },
  { id: "history",  label: "Tarix",    icon: History    },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("stats");
  const [period, setPeriod] = useState<"day" | "month" | "year">("day");
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [productDialog, setProductDialog] = useState<Partial<Product> | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) setProductDialog(prev => prev ? { ...prev, imageUrl: data.url } : prev);
      else toast.error("Rasm yuklanmadi");
    } catch { toast.error("Xato"); }
    finally { setUploading(false); }
  }

  async function loadStats() {
    const res = await fetch(`/api/stats?period=${period}`, { cache: "no-store" });
    setStats(await res.json());
  }
  async function loadProducts() {
    const res = await fetch("/api/products", { cache: "no-store" });
    setCategories(await res.json());
  }
  async function loadOrders() {
    const res = await fetch("/api/orders?status=paid", { cache: "no-store" });
    setOrders(await res.json());
  }

  useEffect(() => { loadStats(); }, [period]);
  useEffect(() => {
    if (tab === "products") loadProducts();
    if (tab === "history") loadOrders();
    if (tab === "shashlik" || tab === "stats") loadStats();
  }, [tab]);

  async function saveProduct() {
    if (!productDialog) return;
    const { id, ...data } = productDialog;
    const url = id ? `/api/products/${id}` : "/api/products";
    const method = id ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { toast.success(id ? "Yangilandi" : "Qo'shildi"); setProductDialog(null); loadProducts(); }
    else toast.error("Xato");
  }

  async function deleteProduct(id: number) {
    if (!confirm("O'chirilsinmi?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("O'chirildi"); loadProducts(); }
  }

  const periodLabel = period === "day" ? "Bugun" : period === "month" ? "Bu oy" : "Bu yil";

  return (
    <main className="min-h-screen">

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-emerald-700">Admin Panel</h1>
            <p className="text-xs text-gray-400">Sohil Choyxona boshqaruvi</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex border-t border-gray-100 px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === id
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="container max-w-5xl py-6 px-4">

        {/* ══════════════════════════════════════
            HISOBOT TAB
        ══════════════════════════════════════ */}
        {tab === "stats" && (
          <div className="space-y-6">

            {/* Period tugmalari */}
            <div className="flex gap-2">
              {(["day", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    period === p
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                      : "border-gray-200 bg-white hover:border-emerald-300 text-gray-600"
                  }`}
                >
                  {p === "day" ? "Bugun" : p === "month" ? "Bu oy" : "Bu yil"}
                </button>
              ))}
            </div>

            {stats ? (
              <>
                {/* Asosiy kartalar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Umumiy tushum</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div className="font-display text-2xl font-bold text-emerald-700">{formatSom(stats.totalRevenue)}</div>
                    <div className="text-xs text-gray-400 mt-1">{periodLabel}</div>
                  </div>

                  <div className="bg-white border-2 border-orange-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Buyurtmalar</span>
                      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                    <div className="font-display text-2xl font-bold text-orange-600">{stats.totalOrders}</div>
                    <div className="text-xs text-gray-400 mt-1">{periodLabel}</div>
                  </div>

                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Xizmat haqi (1%)</span>
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Award className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="font-display text-2xl font-bold text-gray-800">{formatSom(stats.totalService)}</div>
                    <div className="text-xs text-gray-400 mt-1">{periodLabel}</div>
                  </div>
                </div>

                {/* Grafik */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">
                    {period === "day" ? "Soatlar bo'yicha tushum" : period === "month" ? "Kunlar bo'yicha tushum" : "Oylar bo'yicha tushum"}
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any) => [formatSom(Number(value)), "Tushum"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Kategoriya + Top mahsulotlar */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Kategoriyalar</h3>
                    {stats.categories.length === 0 ? (
                      <div className="text-center text-gray-400 py-10 text-sm">Ma'lumot yo'q</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={stats.categories} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                              {stats.categories.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => formatSom(Number(v))} contentStyle={{ borderRadius: 10, fontSize: 12, background: "#fff", border: "1px solid #e5e7eb" }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                          {stats.categories.map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-gray-600">{c.name}</span>
                              </div>
                              <span className="font-semibold text-gray-800">{formatSom(c.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Top mahsulotlar</h3>
                    <div className="space-y-2">
                      {stats.products.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 text-sm">Ma'lumot yo'q</div>
                      ) : (
                        stats.products.slice(0, 8).map((p, i) => (
                          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              i === 0 ? "bg-orange-500 text-white" : i === 1 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-800 truncate">{p.name}</div>
                              <div className="text-xs text-gray-400">{p.quantity} ta • {p.category}</div>
                            </div>
                            <div className="font-bold text-sm text-orange-600 shrink-0">{formatSom(p.revenue)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Stollar bo'yicha */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Stollar bo'yicha tushum</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {stats.tables.filter(t => t.orders > 0).map((t, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-emerald-300 transition-colors">
                        <div className="text-[10px] text-gray-400 uppercase font-medium">{t.zone}</div>
                        <div className="font-bold text-sm text-gray-800 mt-0.5">{t.name}</div>
                        <div className="font-bold text-orange-600 text-sm mt-1.5">{formatSom(t.revenue)}</div>
                        <div className="text-[11px] text-gray-400">{t.orders} buyurtma</div>
                      </div>
                    ))}
                    {stats.tables.filter(t => t.orders > 0).length === 0 && (
                      <div className="col-span-5 text-center text-gray-400 py-8 text-sm">Ma'lumot yo'q</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-400 text-sm animate-pulse">Yuklanmoqda...</div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            MENYU TAB
        ══════════════════════════════════════ */}
        {tab === "products" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-800">Mahsulotlar menyusi</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {categories.reduce((s, c) => s + c.products.length, 0)} ta mahsulot
                </p>
              </div>
              <button
                onClick={() => setProductDialog({ name: "", price: 0, categoryId: categories[0]?.id, isWeighted: false, unit: "dona" })}
                className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                Yangi mahsulot
              </button>
            </div>

            {categories.map((cat) => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-bold text-gray-800">{cat.name}</h3>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">
                    {cat.products.length} ta
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-50 flex items-center justify-center">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="text-xl">{p.emoji}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          <span className="font-semibold text-orange-600">{formatSom(p.price)}</span>
                          {p.isWeighted && <span className="ml-1">/ {p.unit}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => setProductDialog(p)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-emerald-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cat.products.length === 0 && (
                    <div className="px-5 py-4 text-sm text-gray-400">Mahsulot yo'q</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
            SHASHLIK TAB
        ══════════════════════════════════════ */}
        {tab === "shashlik" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-800">Shashlik statistikasi</h2>
                <p className="text-sm text-gray-400 mt-0.5">{periodLabel}</p>
              </div>
              <div className="flex gap-2">
                {(["day", "month", "year"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                      period === p ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 hover:border-emerald-300 text-gray-600"
                    }`}
                  >
                    {p === "day" ? "Bugun" : p === "month" ? "Oy" : "Yil"}
                  </button>
                ))}
              </div>
            </div>

            {stats && (
              <>
                {/* Shashlik turlari */}
                {(() => {
                  const byType: Record<string, { count: number; revenue: number }> = {};
                  for (const s of stats.shashlik) {
                    if (!byType[s.productName]) byType[s.productName] = { count: 0, revenue: 0 };
                    byType[s.productName].count += s.quantity;
                    byType[s.productName].revenue += s.revenue;
                  }
                  const entries = Object.entries(byType);
                  return entries.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {entries.map(([name, data]) => (
                        <div key={name} className="bg-white border-2 border-orange-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                              <Flame className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="font-bold text-sm text-gray-800">{name}</div>
                          </div>
                          <div className="font-display text-3xl font-bold text-emerald-700">{data.count}</div>
                          <div className="text-xs text-gray-400 mb-2">ta / kg sotildi</div>
                          <div className="font-bold text-orange-600">{formatSom(data.revenue)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center text-gray-400 text-sm shadow-sm">
                      {periodLabel} uchun shashlik ma'lumoti yo'q
                    </div>
                  );
                })()}

                {/* Batafsil jadval */}
                {stats.shashlik.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-bold text-sm text-gray-800">Batafsil ro'yxat — {stats.shashlik.length} ta yozuv</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left">
                            <th className="py-3 px-5 text-xs font-semibold text-gray-400 uppercase">Turi</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Stol</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase text-center">Soni</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase text-right">Summa</th>
                            <th className="py-3 px-5 text-xs font-semibold text-gray-400 uppercase">Vaqt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.shashlik.map((s, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                              <td className="py-3 px-5 font-semibold text-gray-800">{s.productName}</td>
                              <td className="py-3 px-4 text-gray-500">{s.tableName}</td>
                              <td className="py-3 px-4 text-center font-bold text-gray-800">{s.quantity}</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-600">{formatSom(s.revenue)}</td>
                              <td className="py-3 px-5 text-xs text-gray-400">{formatDate(s.time)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TARIX TAB
        ══════════════════════════════════════ */}
        {tab === "history" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-gray-800">Buyurtmalar tarixi</h2>
              <p className="text-sm text-gray-400 mt-0.5">{orders.length} ta to'langan buyurtma</p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center shadow-sm">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Hali to'langan buyurtmalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.map((o) => (
                  <div key={o.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800">#{o.id}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-semibold text-sm text-gray-700">{o.table.name}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">to'langan</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(o.paidAt ?? o.createdAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-orange-600">{formatSom(o.total)}</div>
                        <div className="text-xs text-gray-400">{o.items.length} ta mahsulot</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                    <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                      {o.items.map((it: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-500">
                          {it.name} <span className="font-semibold text-gray-700">×{it.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MAHSULOT DIALOGI ═══ */}
      <Dialog open={!!productDialog} onOpenChange={(o) => !o && setProductDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{productDialog?.id ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}</DialogTitle>
          </DialogHeader>
          {productDialog && (
            <div className="space-y-4 py-2">
              {/* Rasm yuklash */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Rasm</Label>
                <div className="flex gap-3 items-center">
                  {productDialog.imageUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shrink-0">
                      <img src={productDialog.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setProductDialog({ ...productDialog, imageUrl: undefined })}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl shrink-0 bg-gray-50">
                      {productDialog.emoji ?? "🍽"}
                    </div>
                  )}
                  <label className={`flex-1 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-3 cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-emerald-400 hover:bg-emerald-50 border-gray-300"}`}>
                    <ImagePlus className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">
                      {uploading ? "Yuklanmoqda..." : "Rasm tanlang"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Nomi</Label>
                <Input
                  value={productDialog.name ?? ""}
                  onChange={(e) => setProductDialog({ ...productDialog, name: e.target.value })}
                  placeholder="Masalan: Qiyma shashlik"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Narx (so'm)</Label>
                <Input
                  type="number"
                  value={productDialog.price ?? 0}
                  onChange={(e) => setProductDialog({ ...productDialog, price: Number(e.target.value) })}
                  placeholder="20000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Kategoriya</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  value={productDialog.categoryId}
                  onChange={(e) => setProductDialog({ ...productDialog, categoryId: Number(e.target.value) })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={productDialog.isWeighted ?? false}
                  onChange={(e) => setProductDialog({ ...productDialog, isWeighted: e.target.checked, unit: e.target.checked ? "kg" : "dona" })}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">Kg bo'yicha sotiladi</div>
                  <div className="text-xs text-gray-400">Kanotcha, go'sht kabi mahsulotlar</div>
                </div>
              </label>
            </div>
          )}
          <DialogFooter className="gap-2">
            <button onClick={() => setProductDialog(null)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-50 transition-colors text-gray-600">
              Bekor qilish
            </button>
            <button onClick={saveProduct} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
              Saqlash
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

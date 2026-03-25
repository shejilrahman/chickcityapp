"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Edit3, Loader2, Save, X, Filter, AlertCircle
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

const RESULTS_CAP = 100;

const SIZES = [["qtr", "Qtr"], ["half", "Half"], ["full", "Full"]];
const RICE_TYPES = [["withRice", "With Rice"], ["meatOnly", "Meat Only"]];

export default function EditProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", mrp: "", portionSlab: null });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch data");
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(prodData);
      setCategories(catData);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    const result = products.filter((p) => {
      const matchSearch = !term || p.name?.toLowerCase().includes(term);
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
    const shouldCap = selectedCategory === "All" && !term;
    return shouldCap ? result.slice(0, RESULTS_CAP) : result;
  }, [products, search, selectedCategory]);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name || "",
      price: p.price || "",
      mrp: p.mrp || "",
      portionSlab: p.portionSlab
        ? {
            withRice: {
              qtr: p.portionSlab?.withRice?.qtr ?? "",
              half: p.portionSlab?.withRice?.half ?? "",
              full: p.portionSlab?.withRice?.full ?? "",
            },
            meatOnly: {
              qtr: p.portionSlab?.meatOnly?.qtr ?? "",
              half: p.portionSlab?.meatOnly?.half ?? "",
              full: p.portionSlab?.meatOnly?.full ?? "",
            },
          }
        : null,
    });
  };

  const setSlabField = (riceType, size, val) => {
    setEditForm(prev => ({
      ...prev,
      portionSlab: {
        ...prev.portionSlab,
        [riceType]: { ...prev.portionSlab[riceType], [size]: val },
      },
    }));
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSubmitting(true);
    try {
      let portionSlab = null;
      if (editForm.portionSlab) {
        portionSlab = {
          withRice: {
            qtr: Number(editForm.portionSlab.withRice.qtr) || 0,
            half: Number(editForm.portionSlab.withRice.half) || 0,
            full: Number(editForm.portionSlab.withRice.full) || 0,
          },
          meatOnly: {
            qtr: Number(editForm.portionSlab.meatOnly.qtr) || 0,
            half: Number(editForm.portionSlab.meatOnly.half) || 0,
            full: Number(editForm.portionSlab.meatOnly.full) || 0,
          },
        };
      }

      const startingPrice = portionSlab
        ? (portionSlab.withRice?.qtr || 0)
        : Number(editForm.price) || 0;

      const res = await fetch("/api/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name,
          price: startingPrice,
          mrp: Number(editForm.mrp) || null,
          portionSlab,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, name: editForm.name, price: startingPrice, mrp: Number(editForm.mrp) || null, portionSlab }
            : p
        )
      );
      setEditingId(null);
      showToast("✅ Product updated successfully!");
    } catch (e) {
      showToast("❌ " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">
      <AdminNav />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 overflow-hidden">
        <div className="flex flex-col mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Edit3 className="text-blue-400" size={24} />
            Edit Product Info
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Update name, price, and portionSlab prices for menu items.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-500" size={16} />
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.title}>{cat.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* List Section */}
          <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-inner">
            <div className="divide-y divide-slate-800">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => startEdit(p)}
                  className={`flex items-center gap-4 p-4 hover:bg-slate-800/50 cursor-pointer transition-colors ${editingId === p.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800 flex-shrink-0">
                    {p.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xl">{p.emoji || "🍽️"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-200 truncate">{p.name}</h4>
                    {p.portionSlab ? (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Qtr ₹{p.portionSlab?.withRice?.qtr} · Half ₹{p.portionSlab?.withRice?.half} · Full ₹{p.portionSlab?.withRice?.full}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5">₹{p.price} {p.mrp > p.price && <span className="line-through opacity-50">₹{p.mrp}</span>}</p>
                    )}
                  </div>
                  <Edit3 size={16} className="text-slate-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Edit Form Section */}
          <div className={`w-80 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col overflow-y-auto transition-all ${editingId ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-blue-400">Edit Details</h3>
              <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {editingId ? (
              <div className="space-y-4 flex-1">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Item Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* portionSlab or flat price */}
                {editForm.portionSlab ? (
                  <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portion Prices (₹)</p>
                    {RICE_TYPES.map(([rt, rtLabel]) => (
                      <div key={rt}>
                        <p className="text-[10px] text-slate-500 font-semibold mb-1.5">{rtLabel}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {SIZES.map(([sz, szLabel]) => (
                            <div key={sz}>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">{szLabel}</label>
                              <input
                                type="number"
                                value={editForm.portionSlab[rt][sz]}
                                onChange={e => setSlabField(rt, sz, e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Price (₹)</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">MRP (₹)</label>
                      <input
                        type="number"
                        value={editForm.mrp}
                        onChange={e => setEditForm(prev => ({ ...prev, mrp: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-auto">
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-600 text-center">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-xs">Select a product to start editing</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Showing {filteredProducts.length} items
        </div>
      </div>
    </div>
  );
}

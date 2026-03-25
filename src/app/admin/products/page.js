"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Plus, Edit3, Trash2, Loader2, Save, X, Filter,
  Eye, EyeOff, Leaf, Flame,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

const SPICE_LEVELS = ["None", "Mild", "Medium", "Hot", "Extra Hot"];

const EMPTY_SLAB = { withRice: { qtr: "", half: "", full: "" }, meatOnly: { qtr: "", half: "", full: "" } };

const FORM_DEFAULT = {
  name: "", description: "", category: "", categoryId: "",
  price: "", mrp: "", image: "", isVeg: false, isBestseller: false,
  spiceLevel: "Medium", hasPortions: false, portionSlab: EMPTY_SLAB,
  priceNote: "", tags: "", sortOrder: "", isAvailable: true,
};

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const RESULTS_CAP = 80;

  const load = useCallback(async () => {
    setIsLoaded(false);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (e) {
      showToast("❌ Failed to load: " + e.message);
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(FORM_DEFAULT);
    setShowForm(true);
  };

  const parsePortionSlab = (slab) => {
    if (!slab || typeof slab !== "object") return EMPTY_SLAB;
    return {
      withRice: {
        qtr: slab.withRice?.qtr ?? "",
        half: slab.withRice?.half ?? "",
        full: slab.withRice?.full ?? "",
      },
      meatOnly: {
        qtr: slab.meatOnly?.qtr ?? "",
        half: slab.meatOnly?.half ?? "",
        full: slab.meatOnly?.full ?? "",
      },
    };
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    const hasPortions = !!p.portionSlab;
    setForm({
      name: p.name || "", description: p.description || "",
      category: p.category || "", categoryId: p.categoryId || "",
      price: p.price || "", mrp: p.mrp || "", image: p.image || "",
      isVeg: Boolean(p.isVeg), isBestseller: Boolean(p.isBestseller),
      spiceLevel: p.spiceLevel || "Medium",
      hasPortions,
      portionSlab: hasPortions ? parsePortionSlab(p.portionSlab) : EMPTY_SLAB,
      priceNote: p.priceNote || "",
      tags: (p.tags || []).join(", "),
      sortOrder: p.sortOrder || "",
      isAvailable: p.isAvailable !== false && !p.hidden,
    });
    setShowForm(true);
  };

  const buildPortionSlab = () => {
    if (!form.hasPortions) return null;
    const s = form.portionSlab;
    return {
      withRice: {
        qtr: Number(s.withRice.qtr) || 0,
        half: Number(s.withRice.half) || 0,
        full: Number(s.withRice.full) || 0,
      },
      meatOnly: {
        qtr: Number(s.meatOnly.qtr) || 0,
        half: Number(s.meatOnly.half) || 0,
        full: Number(s.meatOnly.full) || 0,
      },
    };
  };

  const handleSave = async () => {
    if (!form.name) return showToast("⚠️ Name is required.");
    if (!form.hasPortions && !form.price && !form.priceNote) return showToast("⚠️ Price is required for flat-price items.");
    setIsSubmitting(true);
    try {
      const portionSlab = buildPortionSlab();
      // Starting price = withRice.qtr for portion items, or form.price for flat
      const startingPrice = portionSlab
        ? (portionSlab.withRice?.qtr || 0)
        : Number(form.price) || 0;

      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        categoryId: form.categoryId,
        price: startingPrice,
        mrp: form.mrp ? Number(form.mrp) : null,
        image: form.image,
        isVeg: form.isVeg,
        isBestseller: form.isBestseller,
        spiceLevel: form.spiceLevel,
        portionSlab,
        priceNote: form.priceNote || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
        isAvailable: form.isAvailable,
      };

      const url = editingId ? "/api/products/update" : "/api/products/create";
      if (editingId) payload.id = editingId;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast(editingId ? "✅ Product updated!" : "✅ Product created!");
      setShowForm(false);
      await load();
    } catch (e) {
      showToast("❌ " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("🗑️ Product deleted.");
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  const toggleAvailable = async (p) => {
    const newVal = !(p.isAvailable !== false && !p.hidden);
    try {
      const res = await fetch("/api/products/toggle-available", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isAvailable: newVal }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) =>
        prev.map((prod) => prod.id === p.id ? { ...prod, isAvailable: newVal, hidden: !newVal } : prod)
      );
    } catch {
      showToast("❌ Failed to toggle availability.");
    }
  };

  const setSlabField = (riceType, size, val) => {
    setForm(f => ({
      ...f,
      portionSlab: {
        ...f.portionSlab,
        [riceType]: { ...f.portionSlab[riceType], [size]: val },
      },
    }));
  };

  const catOptions = ["All", ...categories.map((c) => c.title || c).filter(Boolean)];

  if (!isLoaded) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500" size={48} />
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      <AdminNav />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-6 gap-5 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">🍗</span> Products
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{products.length} items in menu</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="text" placeholder="Search products..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-500" size={16} />
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
              value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {catOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-5 overflow-hidden">

          {/* Product List */}
          <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800">
            <div className="divide-y divide-slate-800">
              {filteredProducts.map((p) => {
                const isAvail = p.isAvailable !== false && !p.hidden;
                const hasP = !!p.portionSlab;
                return (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/40 group">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex-shrink-0 relative">
                      {p.image
                        ? <img src={p.image} className="w-full h-full object-cover" alt="" />
                        : <span className="w-full h-full flex items-center justify-center text-xl">🍽️</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 truncate">{p.name}</span>
                        {p.isVeg && <Leaf size={12} className="text-green-400 flex-shrink-0" />}
                        {p.isBestseller && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">⭐ Best</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.category} •{" "}
                        {hasP
                          ? `₹${p.portionSlab?.withRice?.qtr ?? p.price} (Qtr) — ₹${p.portionSlab?.withRice?.full ?? ""} (Full)`
                          : `₹${p.price}`}
                        {p.priceNote && <span className="ml-1 text-amber-500">{p.priceNote}</span>}
                        {p.spiceLevel && p.spiceLevel !== "None" && <span className="ml-2">{p.spiceLevel === "Hot" || p.spiceLevel === "Extra Hot" ? "🌶️" : ""}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleAvailable(p)}
                        title={isAvail ? "Click to hide" : "Click to show"}
                        className={`p-2 rounded-lg transition-colors ${isAvail ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-slate-700 text-slate-500 hover:text-slate-300"}`}
                      >
                        {isAvail ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {!isAvail && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">Hidden</span>}
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center py-16 text-slate-600">
                  <Search size={36} className="opacity-20 mb-3" />
                  <p>No products found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="w-96 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold text-orange-400">{editingId ? "Edit Product" : "Add Product"}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Name */}
                <Field label="Name *">
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="form-input" placeholder="e.g. Classic Mandhi" />
                </Field>

                {/* Description */}
                <Field label="Description">
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="form-input resize-none" placeholder="Short description…" />
                </Field>

                {/* Category */}
                <Field label="Category">
                  <select value={form.category} onChange={e => {
                    const cat = categories.find(c => (c.title || c) === e.target.value);
                    setForm(f => ({ ...f, category: e.target.value, categoryId: cat?.id || "" }));
                  }} className="form-input">
                    <option value="">— Select —</option>
                    {categories.map(c => {
                      const title = c.title || c;
                      return <option key={title} value={title}>{c.emoji || ""} {title}</option>;
                    })}
                  </select>
                </Field>

                {/* Has Portions toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, hasPortions: !f.hasPortions }))}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${form.hasPortions ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}
                  >
                    {form.hasPortions ? "✅ Has Portions (Qtr / Half / Full)" : "❌ Flat Price (no portions)"}
                  </button>
                </div>

                {/* ── Portion Slab Grid ── */}
                {form.hasPortions ? (
                  <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portion Prices (₹)</p>
                    {["withRice", "meatOnly"].map(rt => (
                      <div key={rt}>
                        <p className="text-[10px] text-slate-500 font-semibold mb-1.5">{rt === "withRice" ? "With Rice" : "Meat Only"}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[["qtr", "Qtr"], ["half", "Half"], ["full", "Full"]].map(([sz, lbl]) => (
                            <div key={sz}>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">{lbl}</label>
                              <input
                                type="number"
                                value={form.portionSlab[rt][sz]}
                                onChange={e => setSlabField(rt, sz, e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Flat price fields */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Price (₹) *">
                        <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          className="form-input" placeholder="0" />
                      </Field>
                      <Field label="MRP (₹)">
                        <input type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                          className="form-input" placeholder="0" />
                      </Field>
                    </div>
                    <Field label="Price Note (optional)">
                      <input type="text" value={form.priceNote} onChange={e => setForm(f => ({ ...f, priceNote: e.target.value }))}
                        className="form-input" placeholder="e.g. As per size / Item" />
                    </Field>
                  </div>
                )}

                {/* Spice Level */}
                <Field label="Spice Level">
                  <div className="flex gap-1 flex-wrap">
                    {SPICE_LEVELS.map(lvl => (
                      <button key={lvl} type="button"
                        onClick={() => setForm(f => ({ ...f, spiceLevel: lvl }))}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${form.spiceLevel === lvl ? "bg-orange-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Toggles */}
                <div className="flex gap-3">
                  <Toggle label="🥦 Veg" active={form.isVeg} color="green" onClick={() => setForm(f => ({ ...f, isVeg: !f.isVeg }))} />
                  <Toggle label="⭐ Best" active={form.isBestseller} color="yellow" onClick={() => setForm(f => ({ ...f, isBestseller: !f.isBestseller }))} />
                  <Toggle label="👁 Available" active={form.isAvailable} color="blue" onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))} />
                </div>

                {/* Tags */}
                <Field label="Tags (comma-separated)">
                  <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="form-input" placeholder="mandi, chicken, arabic" />
                </Field>

                {/* Sort Order */}
                <Field label="Sort Order">
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                    className="form-input" placeholder="0" />
                </Field>

                {/* Image URL */}
                <Field label="Image URL">
                  <input type="text" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    className="form-input" placeholder="https://..." />
                  {form.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={form.image} alt="" className="mt-2 w-full h-28 object-cover rounded-xl border border-slate-700" />
                  )}
                </Field>
              </div>

              <div className="p-5 border-t border-slate-800">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Showing {filteredProducts.length} / {products.length} products
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, active, color, onClick }) {
  const colors = {
    green: active ? "bg-green-600 text-white" : "bg-slate-800 text-slate-500",
    yellow: active ? "bg-yellow-600 text-white" : "bg-slate-800 text-slate-500",
    blue: active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500",
  };
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${colors[color]}`}
    >
      {label}
    </button>
  );
}

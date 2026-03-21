"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Save, X, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import AdminNav from "@/components/AdminNav";

const FORM_DEFAULT = {
  code: "", discountType: "percent", discountValue: "", minOrderAmount: "", maxUses: "", expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, [load]);

  async function load() {
    setIsLoaded(false);
    try {
      const res = await fetch("/api/coupons/list");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("❌ Failed to load coupons.");
    } finally {
      setIsLoaded(true);
    }
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreate = async () => {
    if (!form.code || !form.discountValue) return showToast("⚠️ Code and discount value required.");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/coupons/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("✅ Coupon created!");
      setShowForm(false);
      setForm(FORM_DEFAULT);
      await load();
    } catch (e) {
      showToast("❌ " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await fetch("/api/coupons/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
      });
      setCoupons((prev) =>
        prev.map((coupon) => coupon.id === c.id ? { ...coupon, isActive: !coupon.isActive } : coupon)
      );
    } catch {
      showToast("❌ Failed to toggle.");
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await fetch("/api/coupons/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" }),
      });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showToast("🗑️ Coupon deleted.");
    } catch {
      showToast("❌ Failed to delete.");
    }
  };

  if (!isLoaded) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-500" size={48} />
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

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 gap-5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="text-pink-400" />Coupons</h1>
            <p className="text-slate-500 text-sm mt-0.5">{coupons.length} discount codes</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-600/20 transition-all"
          >
            <Plus size={18} /> New Coupon
          </button>
        </div>

        <div className="flex-1 flex gap-5 overflow-hidden">

          {/* Coupon List */}
          <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800">
            <div className="divide-y divide-slate-800">
              {coupons.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/40 group">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
                      <Tag size={18} className="text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-pink-300 tracking-wider">{c.code}</span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                          {c.discountType === "percent" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                        </span>
                        {!c.isActive && <span className="text-[10px] bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
                        {isExpired && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Expired</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Min: ₹{c.minOrderAmount || 0} •
                        Used: {c.usedCount || 0}{c.maxUses ? ` / ${c.maxUses}` : ""} times
                        {c.expiresAt && ` • Expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`p-2 rounded-lg transition-colors ${c.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-500"}`}
                      >
                        {c.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {coupons.length === 0 && (
                <div className="flex flex-col items-center py-16 text-slate-600">
                  <Tag size={36} className="opacity-20 mb-3" />
                  <p>No coupons yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="w-80 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold text-pink-400">New Coupon</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Code *</label>
                  <input type="text" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-pink-500 outline-none uppercase tracking-wider"
                    placeholder="SUMMER20" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Discount Type</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700">
                    {["percent", "flat"].map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, discountType: t }))}
                        className={`flex-1 py-2.5 text-sm font-bold transition-colors ${form.discountType === t ? "bg-pink-600 text-white" : "bg-slate-950 text-slate-500"}`}>
                        {t === "percent" ? "% Off" : "₹ Flat"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                    Discount Value {form.discountType === "percent" ? "(%) *" : "(₹) *"}
                  </label>
                  <input type="number" value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="20" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Min. Order (₹)</label>
                  <input type="number" value={form.minOrderAmount}
                    onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="300" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Max Uses (blank = unlimited)</label>
                  <input type="number" value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="100" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Expiry Date</label>
                  <input type="date" value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                </div>
              </div>

              <div className="p-5 border-t border-slate-800">
                <button onClick={handleCreate} disabled={isSubmitting}
                  className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Create Coupon
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

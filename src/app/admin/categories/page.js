"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit3, Trash2, Loader2, Save, X, ArrowUp, ArrowDown, CheckCircle, XCircle
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

const FORM_DEFAULT = { title: "", emoji: "🍽️", description: "", sortOrder: "", isActive: true };

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, [load]);

  async function load() {
    setIsLoaded(false);
    try {
      const res = await fetch("/api/categories/get");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("❌ Failed to load: " + e.message);
    } finally {
      setIsLoaded(true);
    }
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...FORM_DEFAULT, sortOrder: categories.length });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      title: c.title || "", emoji: c.emoji || "🍽️",
      description: c.description || "", sortOrder: c.sortOrder ?? "",
      isActive: c.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) return showToast("⚠️ Category title is required.");
    setIsSubmitting(true);
    try {
      const url = editingId ? "/api/categories/update" : "/api/categories/create";
      const payload = editingId ? { id: editingId, ...form } : form;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast(editingId ? "✅ Category updated!" : "✅ Category created!");
      setShowForm(false);
      await load();
    } catch (e) {
      showToast("❌ " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? Products in this category will NOT be deleted.`)) return;
    try {
      const res = await fetch("/api/categories/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("🗑️ Category deleted.");
    } catch {
      showToast("❌ Failed to delete.");
    }
  };

  const toggleActive = async (c) => {
    try {
      await fetch("/api/categories/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
      });
      setCategories((prev) =>
        prev.map((cat) => cat.id === c.id ? { ...cat, isActive: !cat.isActive } : cat)
      );
    } catch {
      showToast("❌ Failed to toggle.");
    }
  };

  if (!isLoaded) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-purple-500" size={48} />
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

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 gap-5 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>📂</span> Categories
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{categories.length} categories (stored in Firestore)</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus size={18} /> Add Category
          </button>
        </div>

        <div className="flex-1 flex gap-5 overflow-hidden">

          {/* Category List */}
          <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800">
            <div className="divide-y divide-slate-800">
              {categories.map((c, i) => (
                <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/40 group">
                  <span className="text-2xl w-9 text-center flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{c.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c.isActive !== false ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-slate-700 text-slate-500 border-slate-600"}`}>
                        {c.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>}
                    <p className="text-[11px] text-slate-600 mt-0.5">Sort: {c.sortOrder ?? i}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`p-2 rounded-lg transition-colors ${c.isActive !== false ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-slate-700 text-slate-500 hover:text-slate-300"}`}
                    >
                      {c.isActive !== false ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </button>
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.title)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="flex flex-col items-center py-16 text-slate-600">
                  <p>No categories yet. Add one to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Panel */}
          {showForm && (
            <div className="w-80 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold text-purple-400">{editingId ? "Edit Category" : "New Category"}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. MANDI" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Emoji</label>
                  <input type="text" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="🍚" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    placeholder="Short description…" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${form.isActive ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400"}`}
                >
                  {form.isActive ? "✅ Active" : "❌ Inactive"}
                </button>
              </div>

              <div className="p-5 border-t border-slate-800">
                <button onClick={handleSave} disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

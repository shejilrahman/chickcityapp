"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, ToggleLeft, ToggleRight } from "lucide-react";
import AdminNav from "@/components/AdminNav";

const DEFAULTS = {
  shopName: "ABC ",
  whatsappNumber: "8891930562",
  address: "",
  openingTime: "10:00",
  closingTime: "22:00",
  isOpen: true,
  minOrderAmount: 300,
  deliveryRadius: 5,
  deliveryFee: 0,
  upiId: "",
  logoUrl: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch("/api/settings/get")
      .then(r => r.json())
      .then(data => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => setSettings(DEFAULTS))
      .finally(() => setIsLoaded(true));
  }, []);

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast("✅ Settings saved!");
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

  if (!isLoaded) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <AdminNav />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">⚙️ Store Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">Configure your restaurant details</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-teal-600/20"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save
          </button>
        </div>

        {/* Store Open / Closed Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Store Status</p>
              <p className="text-sm text-slate-500">Toggle to open or close your restaurant instantly</p>
            </div>
            <button onClick={() => set("isOpen", !settings.isOpen)} className="flex-shrink-0">
              {settings.isOpen
                ? <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold">🟢 OPEN</div>
                : <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold">🔴 CLOSED</div>
              }
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <Card title="Basic Info">
          <Field label="Shop Name">
            <input type="text" value={settings.shopName} onChange={e => set("shopName", e.target.value)} className="form-input" />
          </Field>
          <Field label="WhatsApp Number">
            <input type="tel" value={settings.whatsappNumber} onChange={e => set("whatsappNumber", e.target.value)} className="form-input" placeholder="10-digit number" />
          </Field>
          <Field label="UPI ID">
            <input type="text" value={settings.upiId} onChange={e => set("upiId", e.target.value)} className="form-input" placeholder="yourname@upi" />
          </Field>
          <Field label="Address">
            <textarea rows={2} value={settings.address} onChange={e => set("address", e.target.value)} className="form-input resize-none" />
          </Field>
        </Card>

        {/* Hours */}
        <Card title="Operating Hours">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Time">
              <input type="time" value={settings.openingTime} onChange={e => set("openingTime", e.target.value)} className="form-input" />
            </Field>
            <Field label="Closing Time">
              <input type="time" value={settings.closingTime} onChange={e => set("closingTime", e.target.value)} className="form-input" />
            </Field>
          </div>
        </Card>

        {/* Delivery */}
        <Card title="Delivery Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. Order (₹)">
              <input type="number" value={settings.minOrderAmount} onChange={e => set("minOrderAmount", e.target.value)} className="form-input" />
            </Field>
            <Field label="Delivery Radius (km)">
              <input type="number" value={settings.deliveryRadius} onChange={e => set("deliveryRadius", e.target.value)} className="form-input" />
            </Field>
            <Field label="Delivery Fee (₹)">
              <input type="number" value={settings.deliveryFee} onChange={e => set("deliveryFee", e.target.value)} className="form-input" />
            </Field>
          </div>
        </Card>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-teal-600/20"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Save All Settings
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="font-bold text-slate-300 text-sm uppercase tracking-widest border-b border-slate-800 pb-3">{title}</h2>
      {children}
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

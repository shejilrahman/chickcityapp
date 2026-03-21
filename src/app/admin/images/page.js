"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Image as ImageIcon, CheckCircle2, Save, Upload, Trash2, Loader2, CheckSquare, Square, Users, MousePointer2, ClipboardPaste, Globe, ArrowRight, LayoutGrid, Package } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function ImageAdminPage() {
  const [mode, setMode] = useState("products"); // "products" or "categories"
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [saveResults, setSaveResults] = useState(null);
  const [googleSearchTerm, setGoogleSearchTerm] = useState("");

  const searchTimerRef = useRef(null);
  const RESULTS_CAP = 100;

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [cropRect, setCropRect] = useState({ x: 50, y: 50, w: 200, h: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragInfo, setDragInfo] = useState(null);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ]);
      
      if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch data");
      
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      
      setProducts(prodData);
      
      // Ensure "All" is in the categories list for editing
      const hasAll = catData.find(c => c.id === "all" || c.title === "All");
      if (!hasAll) {
        setCategories([{ id: "all", title: "All", emoji: "🍗" }, ...catData]);
      } else {
        setCategories(catData);
      }
      
      setIsLoaded(true);
    } catch (e) {
      setError(e.message);
      setIsLoaded(true);
    }
  };

  const drawOriginal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  }, [originalImage]);

  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    octx.fillStyle = "rgba(0,0,0,0.7)";
    octx.beginPath();
    octx.rect(0, 0, overlay.width, overlay.height);
    octx.rect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    octx.fill("evenodd");

    octx.strokeStyle = "#3b82f6";
    octx.lineWidth = 2;
    octx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    octx.fillStyle = "#3b82f6";
    const s = 6;
    octx.fillRect(cropRect.x - s/2, cropRect.y - s/2, s, s);
    octx.fillRect(cropRect.x + cropRect.w - s/2, cropRect.y - s/2, s, s);
    octx.fillRect(cropRect.x - s/2, cropRect.y + cropRect.h - s/2, s, s);
    octx.fillRect(cropRect.x + cropRect.w - s/2, cropRect.y + cropRect.h - s/2, s, s);
  }, [cropRect]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = search.toLowerCase();
      if (mode === "products") {
        const filtered = products.filter(p => {
          const matchesSearch = p.name?.toLowerCase().includes(term);
          const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
          return matchesSearch && matchesCategory;
        });
        const shouldCap = selectedCategory === "All" && !term;
        setFilteredProducts(shouldCap ? filtered.slice(0, RESULTS_CAP) : filtered);
      } else {
        const filtered = categories.filter(c => c.title?.toLowerCase().includes(term));
        setFilteredProducts(filtered);
      }
    }, 200);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, products, categories, selectedCategory, mode]);

  useEffect(() => {
    if (originalImage && canvasRef.current) {
      drawOriginal();
      drawOverlay();
    }
  }, [originalImage, cropRect, drawOriginal, drawOverlay]);

  const initImage = (src) => {
    const img = new Image();
    img.onload = () => {
      const container = document.getElementById("canvas-container");
      if (!container) return;
      const maxW = container.clientWidth - 80;
      const maxH = container.clientHeight - 80;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      setOriginalImage(img);
      const size = Math.min(canvas.width, canvas.height) * 0.9;
      setCropRect({ x: (canvas.width - size) / 2, y: (canvas.height - size) / 2, w: size, h: size });
    };
    img.src = src;
  };

  const handleClear = () => {
    setOriginalImage(null);
    setSaveResults(null);
    setSelectedIds(new Set());
    setCropRect({ x: 50, y: 50, w: 200, h: 200 });
  };

  const resetBox = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const size = Math.min(canvas.width, canvas.height) * 0.8;
    setCropRect({ x: (canvas.width - size) / 2, y: (canvas.height - size) / 2, w: size, h: size });
  };

  const handleGoogleSearch = (term) => {
    if(!term) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(term)}&tbm=isch`, "_blank");
  };

  // GLOBAL PASTE LISTENER
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      const item = Array.from(e.clipboardData.items).find(x => x.type.indexOf("image") !== -1);
      if (item) {
        setSaveResults(null);
        const reader = new FileReader();
        reader.onload = (ev) => initImage(ev.target.result);
        reader.readAsDataURL(item.getAsFile());
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [categories]); // dependencies keep it alive

  const toggleSelect = (item) => {
    setSaveResults(null);
    const id = item.id;
    const name = mode === "products" ? item.name : item.title;
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (next.size === 1) {
          setGoogleSearchTerm(name);
        }
      }
      return next;
    });
  };

  const getCroppedBase64 = () => {
    const canvas = canvasRef.current;
    const scale = originalImage.width / canvas.width;
    const temp = document.createElement("canvas");
    temp.width = cropRect.w * scale;
    temp.height = cropRect.h * scale;
    temp.getContext("2d").drawImage(
      originalImage,
      cropRect.x * scale, cropRect.y * scale,
      cropRect.w * scale, cropRect.h * scale,
      0, 0, temp.width, temp.height
    );
    return temp.toDataURL("image/jpeg", 0.9);
  };

  const handleSave = async () => {
    if (!originalImage || selectedIds.size === 0) return;
    setIsSubmitting(true);
    const base64 = getCroppedBase64();
    const succeeded = [];
    const failed = [];
    const apiUrl = mode === "products" ? "/api/products/update-image" : "/api/categories/update-image";

    await Promise.all([...selectedIds].map(async (id) => {
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, image: base64 })
        });
        if (res.ok) succeeded.push({ id, path: (await res.json()).path }); else failed.push(id);
      } catch { failed.push(id); }
    }));

    if (mode === "products") {
      setProducts(prev => prev.map(p => {
        const found = succeeded.find(s => s.id === p.id);
        return found ? { ...p, image: found.path } : p;
      }));
    } else {
      setCategories(prev => prev.map(c => {
        const found = succeeded.find(s => s.id === c.id);
        return found ? { ...c, image: found.path } : c;
      }));
    }

    setSaveResults({ success: succeeded.map(s => s.id), failed });
    setIsSubmitting(false);
    if (failed.length === 0) { 
      setTimeout(() => handleClear(), 1500); 
    }
  };

  const onMouseDown = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setIsDragging(true);
    const pad = 15;
    if (Math.abs(mouseX - (cropRect.x + cropRect.w)) < pad && Math.abs(mouseY - (cropRect.y + cropRect.h)) < pad) {
      setDragInfo({ type: "resize" });
    } else if (mouseX > cropRect.x && mouseX < cropRect.x + cropRect.w && mouseY > cropRect.y && mouseY < cropRect.y + cropRect.h) {
      setDragInfo({ type: "move", offsetX: mouseX - cropRect.x, offsetY: mouseY - cropRect.y });
    } else {
      setCropRect({ x: mouseX, y: mouseY, w: 0, h: 0 });
      setDragInfo({ type: "create" });
    }
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const mx = Math.max(0, Math.min(overlayRef.current.width, e.clientX - rect.left));
    const my = Math.max(0, Math.min(overlayRef.current.height, e.clientY - rect.top));
    setCropRect(prev => {
      let r = { ...prev };
      if (dragInfo.type === "resize") { r.w = mx - prev.x; r.h = my - prev.y; }
      else if (dragInfo.type === "move") { 
        r.x = Math.max(0, Math.min(overlayRef.current.width - prev.w, mx - dragInfo.offsetX));
        r.y = Math.max(0, Math.min(overlayRef.current.height - prev.h, my - dragInfo.offsetY));
      }
      else { r.w = mx - prev.x; r.h = my - prev.y; }
      return r;
    });
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setCropRect(prev => {
      let newRect = { ...prev };
      if (newRect.w < 0) { newRect.x += newRect.w; newRect.w = Math.abs(newRect.w); }
      if (newRect.h < 0) { newRect.y += newRect.h; newRect.h = Math.abs(newRect.h); }
      return newRect;
    });
  };

  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 p-4 font-mono">
        <h2 className="text-2xl font-bold mb-4">Error Loading Data</h2>
        <p className="bg-slate-900 p-4 rounded border border-red-900/50 max-w-md text-center">{error}</p>
        <button
          onClick={() => { setError(null); setIsLoaded(false); fetchData(); }}
          className="mt-6 px-6 py-2 bg-slate-800 text-slate-200 rounded hover:bg-slate-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoaded) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      <AdminNav />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[420px] border-r border-slate-800 flex flex-col bg-slate-900 shadow-2xl z-20">
          <div className="p-5 space-y-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <ImageIcon size={22} className="text-blue-500" /> Images
              </h2>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button 
                  onClick={() => { setMode("products"); handleClear(); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${mode === "products" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-900"}`}
                >
                  <Package size={12} /> Products
                </button>
                <button 
                  onClick={() => { setMode("categories"); handleClear(); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${mode === "categories" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-900"}`}
                >
                  <LayoutGrid size={12} /> Categories
                </button>
              </div>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input type="text" placeholder={`Search ${mode}...`} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {mode === "products" && (
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.title}>{c.emoji} {c.title}</option>)}
              </select>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => selectedIds.size > 0 ? setSelectedIds(new Set()) : filteredProducts.forEach(x => toggleSelect(x))} 
                className="text-xs font-bold text-slate-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors">
                {selectedIds.size > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                {selectedIds.size > 0 ? "Deselect All" : "Select All Visible"}
              </button>
              {selectedIds.size > 0 && <span className="text-xs font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg animate-pulse">{selectedIds.size} Selected</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {filteredProducts.map(item => {
              const id = item.id;
              const name = mode === "products" ? item.name : item.title;
              const sub = mode === "products" ? item.category : "Category";
              const img = item.image;
              
              const sel = selectedIds.has(id);
              const ok = saveResults?.success.includes(id);
              const fail = saveResults?.failed.includes(id);
              
              return (
                <div key={id} className="group/item relative">
                  <button onClick={() => toggleSelect(item)} 
                    className={`w-full text-left p-4 flex items-center gap-4 transition-all hover:bg-slate-800/40 relative
                      ${sel ? "bg-blue-600/10 z-10" : ""}
                      ${ok ? "bg-green-500/5" : ""}
                      ${fail ? "bg-red-500/5" : ""}
                    `}>
                    {sel && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <div className={`w-16 h-16 flex-shrink-0 rounded-xl bg-slate-950 border overflow-hidden transition-all shadow-lg
                      ${sel ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-800"}
                    `}>
                      {img 
                        ? <img src={img} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-800"><ImageIcon size={24} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${sel ? "text-blue-400" : "text-slate-300"}`}>{mode === "categories" && item.emoji} {name}</div>
                      <div className="text-[10px] font-black text-slate-600 mt-0.5 uppercase tracking-tighter">{sub}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {img && <span className="text-[9px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase">Image OK</span>}
                        {ok && <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase animate-bounce">Saved!</span>}
                        {fail && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">Failed</span>}
                      </div>
                    </div>
                    <div className={`transition-all ${sel ? "text-blue-500 scale-110" : "text-slate-700"}`}>
                      {sel ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleGoogleSearch(name); }}
                    title="Search on Google Images"
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 hover:text-blue-400 hover:border-blue-500/50 opacity-0 group-hover/item:opacity-100 transition-all z-20 shadow-xl"
                  >
                    <Globe size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
               {mode === "products" ? (
                 <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(products.filter(p => p.image).length / (products.length || 1)) * 100}%` }} />
               ) : (
                 <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${(categories.filter(c => c.image).length / (categories.length || 1)) * 100}%` }} />
               )}
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col bg-slate-950">
          <div className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col flex-shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{mode} Workspace</span>
                <span className="text-sm font-black text-white whitespace-nowrap">
                   {selectedIds.size === 0 ? `Select ${mode} to begin` : `${selectedIds.size} Target Selected`}
                </span>
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 ml-4 flex-1 max-w-md group focus-within:border-blue-500/50 transition-all">
                  <div className="p-1 text-slate-500 group-focus-within:text-blue-500">
                    <Globe size={14} />
                  </div>
                  <input 
                    type="text" 
                    value={googleSearchTerm} 
                    onChange={e => setGoogleSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleGoogleSearch(googleSearchTerm)}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-300 w-full placeholder:text-slate-600"
                    placeholder="Edit search term..."
                  />
                  <button 
                    onClick={() => handleGoogleSearch(googleSearchTerm)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {originalImage && (
                <>
                  <button onClick={resetBox} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded-lg transition-all text-slate-400">
                    <MousePointer2 size={12} /> Reset Box
                  </button>
                  <button onClick={handleClear} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold rounded-lg transition-all text-red-500 border border-red-500/20">
                    <Trash2 size={12} /> Clear
                  </button>
                </>
              )}
              <div className="h-6 w-px bg-slate-800 mx-1" />
              <button onClick={() => document.getElementById("file-upload").click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all">
                <Upload size={14} /> Browse
              </button>
              <button disabled={!originalImage || selectedIds.size === 0 || isSubmitting} onClick={handleSave} 
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-600/20">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Apply to {selectedIds.size} Items
              </button>
            </div>
          </div>

          <div id="canvas-container" className="flex-1 relative bg-checkerboard flex items-center justify-center p-12 overflow-hidden" 
            onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            
            {!originalImage && (
              <div className="flex flex-col items-center text-center max-w-sm">
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                  <ClipboardPaste size={32} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-black mb-2">Ready to Paste</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Select a {mode === "products" ? "product" : "category"} to search on Google. Copy an image from results and press <kbd className="bg-slate-800 px-2 py-1 rounded text-white text-xs mx-1">Ctrl + V</kbd> to paste.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                   <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <MousePointer2 size={16} className="text-blue-500 mb-2" />
                      <p className="text-[10px] font-bold uppercase text-slate-400">Select Targets</p>
                   </div>
                   <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <Globe size={16} className="text-green-500 mb-2" />
                      <p className="text-[10px] font-bold uppercase text-slate-400">Google Search</p>
                   </div>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="shadow-2xl rounded-lg" />
            <canvas ref={overlayRef} onMouseDown={onMouseDown} className="absolute z-10 cursor-crosshair" />
          </div>
        </div>
      </div>
      <input id="file-upload" type="file" className="hidden" accept="image/*" 
        onChange={e => { if(e.target.files?.[0]) { const r = new FileReader(); r.onload = (ev) => initImage(ev.target.result); r.readAsDataURL(e.target.files[0]); }}} />
    </div>
  );
}

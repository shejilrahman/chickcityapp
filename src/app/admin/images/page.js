"use client";
// Trigger re-compilation

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Image as ImageIcon, CheckCircle2, Save, Upload, Trash2, ChevronRight, Loader2, CheckSquare, Square, Users } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function ImageAdminPage() {
  console.log("ImageAdminPage Rendering...");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIds, setSelectedIds] = useState(new Set()); // multi-select set
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [saveResults, setSaveResults] = useState(null); // { success: [], failed: [] }

  const searchTimerRef = useRef(null);
  const RESULTS_CAP = 50;

  // Canvas refs
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [cropRect, setCropRect] = useState({ x: 50, y: 50, w: 200, h: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragInfo, setDragInfo] = useState(null);

  const fetchProducts = async () => {
    try {
      console.log("Fetching products...");
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log(`Loaded ${data.length} products`);
      setProducts(data);
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load products:", e);
      setError(e.message);
      setIsLoaded(true);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log(`Loaded ${data.length} categories`);
      setCategories(data);
    } catch (e) {
      console.error("Failed to load categories:", e);
      // Not setting error here as it's not fatal, products can still load
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

    // Dim outside
    octx.fillStyle = "rgba(0,0,0,0.6)";
    octx.beginPath();
    octx.rect(0, 0, overlay.width, overlay.height);
    octx.rect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    octx.fill("evenodd");

    // Handle
    octx.strokeStyle = "#fbbf24";
    octx.lineWidth = 2;
    octx.setLineDash([5, 5]);
    octx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    octx.setLineDash([]);

    octx.fillStyle = "#fbbf24";
    // Corners
    octx.fillRect(cropRect.x - 4, cropRect.y - 4, 8, 8);
    octx.fillRect(cropRect.x + cropRect.w - 4, cropRect.y - 4, 8, 8);
    octx.fillRect(cropRect.x - 4, cropRect.y + cropRect.h - 4, 8, 8);
    octx.fillRect(cropRect.x + cropRect.w - 4, cropRect.y + cropRect.h - 4, 8, 8);
  }, [cropRect]);

  // Load products & categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products — debounced 300ms so rapid keystrokes don't trigger re-renders
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = search.toLowerCase();
      const filtered = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(term);
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
      // Only cap when browsing "All" with no search — a specific category shows everything
      const shouldCap = selectedCategory === "All" && !term;
      setFilteredProducts(shouldCap ? filtered.slice(0, RESULTS_CAP) : filtered);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, products, selectedCategory]);

  // Sync canvas
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

      const maxW = container.clientWidth - 40;
      const maxH = container.clientHeight - 40;
      let w = img.width;
      let h = img.height;

      const ratio = Math.min(maxW / w, maxH / h);
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;

      canvas.width = w * ratio;
      canvas.height = h * ratio;
      overlay.width = canvas.width;
      overlay.height = canvas.height;

      setOriginalImage(img);

      const size = Math.min(canvas.width, canvas.height) * 0.8;
      setCropRect({
        x: (canvas.width - size) / 2,
        y: (canvas.height - size) / 2,
        w: size,
        h: size
      });
    };
    img.src = src;
  };

  const handlePaste = (e) => {
    const item = Array.from(e.clipboardData.items).find(x => x.type.indexOf("image") !== -1);
    if (item) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (ev) => initImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Toggle product selection
  const toggleSelect = (id) => {
    setSaveResults(null);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all visible (filtered) products
  const selectAll = () => {
    setSaveResults(null);
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredProducts.forEach(p => next.add(p.id));
      return next;
    });
  };

  // Deselect all
  const deselectAll = () => {
    setSaveResults(null);
    setSelectedIds(new Set());
  };

  // Build the cropped base64 image
  const getCroppedBase64 = () => {
    const canvas = canvasRef.current;
    const scale = originalImage.width / canvas.width;
    const temp = document.createElement("canvas");
    const tctx = temp.getContext("2d");

    temp.width = cropRect.w * scale;
    temp.height = cropRect.h * scale;

    tctx.drawImage(
      originalImage,
      cropRect.x * scale, cropRect.y * scale,
      cropRect.w * scale, cropRect.h * scale,
      0, 0, temp.width, temp.height
    );

    return temp.toDataURL("image/jpeg", 0.85);
  };

  // Save image to all selected products
  const handleSave = async () => {
    if (!originalImage || selectedIds.size === 0) return;
    setIsSubmitting(true);
    setSaveResults(null);

    const base64 = getCroppedBase64();
    const succeeded = [];
    const failed = [];

    await Promise.all(
      [...selectedIds].map(async (id) => {
        try {
          const res = await fetch("/api/products/update-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, image: base64 })
          });
          if (res.ok) {
            const data = await res.json();
            succeeded.push({ id, path: data.path });
          } else {
            failed.push(id);
          }
        } catch {
          failed.push(id);
        }
      })
    );

    // Update local state
    setProducts(prev =>
      prev.map(p => {
        const found = succeeded.find(s => s.id === p.id);
        return found ? { ...p, image: found.path } : p;
      })
    );

    setSaveResults({ success: succeeded.map(s => s.id), failed });
    setIsSubmitting(false);

    // Clear selection if all succeeded
    if (failed.length === 0) {
      setSelectedIds(new Set());
      setOriginalImage(null);
    }
  };

  const onMouseDown = (e) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setIsDragging(true);
    const pad = 10;

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
    if (!isDragging || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(overlayRef.current.width, e.clientX - rect.left));
    const mouseY = Math.max(0, Math.min(overlayRef.current.height, e.clientY - rect.top));

    setCropRect(prev => {
      let newRect = { ...prev };
      if (dragInfo.type === "resize") {
        newRect.w = mouseX - prev.x;
        newRect.h = mouseY - prev.y;
      } else if (dragInfo.type === "move") {
        newRect.x = Math.max(0, Math.min(overlayRef.current.width - prev.w, mouseX - dragInfo.offsetX));
        newRect.y = Math.max(0, Math.min(overlayRef.current.height - prev.h, mouseY - dragInfo.offsetY));
      } else if (dragInfo.type === "create") {
        newRect.w = mouseX - prev.x;
        newRect.h = mouseY - prev.y;
      }
      return newRect;
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

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));

  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 p-4 font-mono">
        <h2 className="text-2xl font-bold mb-4">Error Loading Products</h2>
        <p className="bg-slate-900 p-4 rounded border border-red-900/50 max-w-md text-center">{error}</p>
        <button
          onClick={() => { setError(null); setIsLoaded(false); fetchProducts(); }}
          className="mt-6 px-6 py-2 bg-slate-800 text-slate-200 rounded hover:bg-slate-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono" onPaste={handlePaste}>
      <AdminNav />
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 border-r border-slate-800 flex flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <ImageIcon size={20} className="text-blue-400" />
            Product Images
          </h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.title}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-select toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={allVisibleSelected ? deselectAll : selectAll}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {allVisibleSelected
                  ? <CheckSquare size={13} className="text-blue-400" />
                  : <Square size={13} className="text-slate-400" />
                }
                {allVisibleSelected ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="text-xs px-2 py-1.5 rounded text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {selectedIds.size > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-400 font-bold">
                <Users size={12} />
                {selectedIds.size} selected
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.has(p.id);
            const saveOk = saveResults?.success.includes(p.id);
            const saveFail = saveResults?.failed.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`w-full text-left p-3 border-b border-slate-800/50 flex items-center gap-3 hover:bg-slate-800/50 transition-colors
                  ${isSelected ? "bg-blue-600/20 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}
                  ${saveOk ? "border-l-green-500 bg-green-900/10" : ""}
                  ${saveFail ? "border-l-red-500 bg-red-900/10" : ""}
                `}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {isSelected
                    ? <CheckSquare size={16} className="text-blue-400" />
                    : <Square size={16} className="text-slate-600" />
                  }
                </div>

                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                    {p.image
                      ? <img src={p.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" loading="lazy" />
                      : <ImageIcon size={16} className="text-slate-600" />
                    }
                  </div>
                  {p.image && <CheckCircle2 className="absolute -top-1 -right-1 text-green-500 fill-slate-900" size={14} />}
                  {saveOk && <CheckCircle2 className="absolute -top-1 -right-1 text-green-400 fill-green-900 animate-bounce" size={14} />}
                  {saveFail && <span className="absolute -top-1 -right-1 text-red-400 text-[10px] font-bold">✕</span>}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-bold leading-snug">{p.name || "Untitled"}</div>
                  <div className="text-[10px] text-slate-500">ID: {p.id}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-800 text-xs">
          <div className="flex justify-between mb-2">
            <span>Progress</span>
            <span>{Math.round((products.filter(p => p.image).length / products.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(products.filter(p => p.image).length / products.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {selectedIds.size === 0 ? (
              <span className="text-slate-500 text-sm">Select products from the list to assign an image</span>
            ) : (
              <div>
                <p className="text-sm font-bold text-blue-300 flex items-center gap-1.5">
                  <Users size={14} />
                  {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""} selected
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-sm">
                  {products
                    .filter(p => selectedIds.has(p.id))
                    .map(p => p.name)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-sm disabled:opacity-40"
              onClick={() => document.getElementById("file-upload").click()}
            >
              <Upload size={16} /> Open Image
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-sm disabled:opacity-40"
              onClick={() => setOriginalImage(null)}
              disabled={!originalImage}
            >
              <Trash2 size={16} /> Clear
            </button>
            <button
              className="flex items-center gap-2 px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
              onClick={handleSave}
              disabled={!originalImage || selectedIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save{selectedIds.size > 1 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
        </div>

        {/* Save result banner */}
        {saveResults && (
          <div className={`px-6 py-2 text-sm flex items-center gap-3 ${saveResults.failed.length === 0 ? "bg-green-900/30 text-green-300 border-b border-green-800/40" : "bg-red-900/30 text-red-300 border-b border-red-800/40"}`}>
            {saveResults.failed.length === 0
              ? `✓ Image saved to ${saveResults.success.length} product${saveResults.success.length > 1 ? "s" : ""} successfully`
              : `⚠ Saved: ${saveResults.success.length}, Failed: ${saveResults.failed.length} (IDs: ${saveResults.failed.join(", ")})`
            }
            <button onClick={() => setSaveResults(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        <div
          id="canvas-container"
          className="flex-1 relative bg-slate-950 flex items-center justify-center p-8 overflow-hidden"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {!originalImage && selectedIds.size > 0 && (
            <div className="text-center text-slate-500 opacity-50 select-none">
              <ImageIcon size={64} className="mx-auto mb-4" />
              <p className="text-lg">Paste a screenshot (Ctrl+V)</p>
              <p className="text-sm">or click &quot;Open Image&quot; to browse files</p>
              <p className="text-sm mt-2 text-blue-400 opacity-80">
                This image will be applied to {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {selectedIds.size === 0 && !originalImage && (
            <div className="text-center text-slate-700 animate-pulse">
              <Users size={48} className="mx-auto mb-2 opacity-20" />
              <p>Select one or more products from the list</p>
            </div>
          )}

          <canvas ref={canvasRef} className="shadow-2xl shadow-black rounded" />
          <canvas
            ref={overlayRef}
            onMouseDown={onMouseDown}
            className="absolute z-10 cursor-crosshair"
          />
        </div>

        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              const reader = new FileReader();
              reader.onload = (ev) => initImage(ev.target.result);
              reader.readAsDataURL(e.target.files[0]);
            }
          }}
        />
      </div>
      </div>
    </div>
  );
}

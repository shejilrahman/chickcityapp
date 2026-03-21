"use client";

const categoryEmoji = {
  "All":               "🍗",
  "MANDI":             "🍚",
  "CHICKEN":           "🍗",
  "BIRTHDAY CAKES":     "🎂",
  "BEVERAGES":         "🥤",
  "DESSERTS":          "🍨",
  "SNAKCS":            "🍟",
  "VEG ITEMS":        "🥗",
  "CHINESE":           "🍜",
};

export default function CategorySidebar({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <div
      className="w-[72px] flex-shrink-0 h-full overflow-y-auto hide-scrollbar flex flex-col pt-1"
      style={{ background: "#f0faf4" }}
    >
      {categories.map((cat) => {
        const title = cat.title || cat;
        const isActive = selectedCategory === title;
        const emoji = cat.emoji || categoryEmoji[title] || "📦";
        const label = title === "All" ? "All" : title.charAt(0) + title.slice(1).toLowerCase();
        const image = cat.image;

        return (
          <button
            key={title}
            onClick={() => setSelectedCategory(title)}
            className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-1 text-center transition-all
              ${isActive
                ? "bg-white shadow-sm"
                : "bg-transparent active:bg-green-100/60"
              }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-[4px] bg-green-600 rounded-r-full" />
            )}

            {/* Image/Emoji Container */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300
              ${isActive ? "scale-110 shadow-md ring-2 ring-green-500/10" : "scale-100"}
              ${image ? "" : "bg-emerald-50"}
            `}>
              {image ? (
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[22px] leading-none">
                  {emoji}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              className={`text-[9px] font-bold leading-tight uppercase tracking-tighter
                ${isActive ? "text-green-800" : "text-gray-400"}`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

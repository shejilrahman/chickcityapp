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
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        const emoji = categoryEmoji[category] || "📦";
        const label = category === "All" ? "All" : category.charAt(0) + category.slice(1).toLowerCase();

        return (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`relative flex flex-col items-center justify-center gap-1 py-3 px-1 text-center transition-all
              ${isActive
                ? "bg-white shadow-sm"
                : "bg-transparent active:bg-green-100/60"
              }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-green-600 rounded-r-full" />
            )}

            {/* Emoji */}
            <span className={`text-[22px] leading-none transition-transform ${isActive ? "scale-110" : ""}`}>
              {emoji}
            </span>

            {/* Label */}
            <span
              className={`text-[10px] font-semibold leading-tight
                ${isActive ? "text-green-700" : "text-gray-500"}`}
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

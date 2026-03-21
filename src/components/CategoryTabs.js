"use client";

const categoryEmoji = {
  "All": "🛒",
  "GROCERY": "🌾",
  "OILS": "🫙",
  "BEVERAGES": "🥤",
  "INSTANT FOOD": "🍜",
  "TOILETRIES": "🧴",
  "DISINFECTANTS": "🧹",
  "MEDICAL PRODUCTS": "💊",
  "VEGETABLES": "🥦",
  "STATIONERY": "✏️",
};

export default function CategoryTabs({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <div className="flex overflow-x-auto hide-scrollbar -mx-4 px-4 pb-3 space-x-2 snap-x">
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        const emoji = categoryEmoji[category] || "📦";
        return (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-all snap-start flex items-center gap-1.5 flex-shrink-0 ${
              isActive
                ? "bg-green-700 text-white shadow-md shadow-green-700/25"
                : "bg-white text-gray-600 border border-gray-200 active:bg-gray-100"
            }`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            {category}
          </button>
        );
      })}
    </div>
  );
}

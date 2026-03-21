"use client";

import { Search, X } from "lucide-react";

export default function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-[17px] w-[17px] text-gray-400" />
      </div>
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        className="block w-full pl-11 pr-10 py-3.5 bg-white border-0 rounded-2xl text-gray-900 text-[15px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md transition-all"
        placeholder="Search groceries, spices…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm ? (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

// src/context/SearchContext.jsx
// Global dynamic search context deriving index directly from active dataset

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useDataset } from "./DatasetContext";
import { buildSearchIndex, searchEntities } from "../services/searchService";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const { activeDataset, activeCols, currentVersion } = useDataset() || {};
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Dynamic index built exclusively from active dataset
  const index = useMemo(() => {
    return buildSearchIndex({
      activeDataset,
      activeCols: activeCols || [],
      customItems: [
        { type: "Report", name: "Executive Performance Deck", detail: "9 Sections compiled • PDF/PPTX", link: "report" },
        { type: "Insight", name: "High Attention Anomaly Scan", detail: "Automated scan on current dataset", link: "insights" }
      ]
    });
  }, [activeDataset?.id, activeDataset?.name, activeCols]);

  const results = useMemo(() => {
    return searchEntities(query, index);
  }, [query, index]);

  // Reset selectedIndex when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const openSearch = () => {
    setQuery("");
    setSelectedIndex(0);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  const navigateResults = (direction) => {
    if (results.length === 0) return;
    if (direction === "down") {
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (direction === "up") {
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    }
  };

  return (
    <SearchContext.Provider value={{
      searchOpen,
      openSearch,
      closeSearch,
      query,
      setQuery,
      results,
      selectedIndex,
      setSelectedIndex,
      navigateResults,
      activeResult: results[selectedIndex] || null
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}

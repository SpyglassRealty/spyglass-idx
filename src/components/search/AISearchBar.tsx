'use client';

import { useState, useRef, useEffect } from 'react';
import { SparklesIcon, MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Listing } from '@/types/listing';

interface AISearchBarProps {
  onResults: (results: {
    listings: Listing[];
    total: number;
    summary: string;
    nlpId: string;
  }) => void;
  onClear: () => void;
  placeholder?: string;
}

export function AISearchBar({ onResults, onClear, placeholder }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [nlpId, setNlpId] = useState<string | null>(null);
  const [suggestions] = useState([
    "3 bed house in South Austin under $600k",
    "Modern condo downtown with a view",
    "Family home near good schools in Round Rock",
    "Luxury property in Westlake with pool",
    "Fixer-upper under $400k with big yard",
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/nlp-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          nlpId: nlpId, // Include previous context if exists
        }),
      });

      if (response.status === 406) {
        setError('Please ask about real estate listings. Try something like "Find me a 3 bed house in Austin"');
        return;
      }

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      setSummary(data.summary);
      setNlpId(data.nlpId);
      
      onResults({
        listings: data.listings,
        total: data.total,
        summary: data.summary,
        nlpId: data.nlpId,
      });

    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('AI Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSummary(null);
    setNlpId(null);
    setError(null);
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  return (
    <div className="relative w-full">
      {/* Main search input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-spyglass-orange" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => !query && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder || "Try: '3 bed house in Austin under $500k with a pool'"}
          className="w-full pl-12 pr-24 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spyglass-orange focus:border-transparent shadow-sm"
          disabled={isSearching}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-spyglass-orange text-white rounded-lg hover:bg-spyglass-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {summary && !error && (
        <div className="mt-2 px-4 py-2 bg-spyglass-orange/10 border border-spyglass-orange/20 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-spyglass-orange">AI understood: </span>
            {summary}
          </p>
          {nlpId && (
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Add more criteria to refine your search (e.g., "also needs a garage")
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Try asking...
            </p>
          </div>
          <div className="py-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4 text-spyglass-orange/60" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

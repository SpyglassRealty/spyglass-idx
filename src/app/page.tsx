'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from '@/components/ui/Header';
import { FilterBar } from '@/components/search/FilterBar';
import { AISearchBar } from '@/components/search/AISearchBar';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { austinCommunities } from '@/data/austin-communities';
import { Listing, SearchFilters } from '@/types/listing';
import { CommunityPolygon } from '@/types/community';
import { useListings } from '@/hooks/useListings';
import { ListingDetailOverlay } from '@/components/listings/ListingDetailOverlay';
import { SparklesIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

// Lazy load Leaflet map to avoid SSR issues
const LeafletMap = lazy(() => 
  import('@/components/map/LeafletMap').then(mod => ({ default: mod.LeafletMap }))
);

function MapLoadingFallback() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  );
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPolygon | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  
  // AI Search state
  const [searchMode, setSearchMode] = useState<'filters' | 'ai'>('ai'); // Default to AI
  const [aiListings, setAiListings] = useState<Listing[]>([]);
  const [aiTotal, setAiTotal] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiActive, setIsAiActive] = useState(false);

  const { 
    listings: filterListings, 
    loading, 
    error, 
    total: filterTotal, 
    hasMore, 
    fetchListings, 
    loadMore 
  } = useListings({ autoFetch: searchMode === 'filters' });
  
  // Use AI listings when AI search is active, otherwise use filter listings
  const listings = isAiActive ? aiListings : filterListings;
  const total = isAiActive ? aiTotal : filterTotal;

  // Refetch when filters change (only in filter mode)
  useEffect(() => {
    if (searchMode === 'filters' || !isAiActive) {
      const searchFilters: SearchFilters = {
        ...filters,
        polygon: selectedCommunity?.coordinates,
      };
      fetchListings(searchFilters);
    }
  }, [filters, selectedCommunity, searchMode, isAiActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectCommunity = (community: CommunityPolygon) => {
    if (selectedCommunity?.id === community.id) {
      setSelectedCommunity(null);
    } else {
      setSelectedCommunity(community);
    }
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setIsAiActive(false);
    setFilters(newFilters);
  };

  const handleAIResults = (results: { listings: Listing[]; total: number; summary: string; nlpId: string }) => {
    setAiListings(results.listings);
    setAiTotal(results.total);
    setAiSummary(results.summary);
    setIsAiActive(true);
  };

  const handleAIClear = () => {
    setAiListings([]);
    setAiTotal(0);
    setAiSummary(null);
    setIsAiActive(false);
    fetchListings(filters);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      {/* Search Mode Toggle + Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        {/* Mode Toggle */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setSearchMode('ai'); if (!isAiActive) fetchListings(filters); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'ai'
                  ? 'bg-white text-spyglass-orange shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              AI Search
            </button>
            <button
              onClick={() => { setSearchMode('filters'); setIsAiActive(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'filters'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              Filters
            </button>
          </div>
          
          {searchMode === 'ai' && (
            <p className="text-sm text-gray-500 hidden md:block">
              Describe what you're looking for in plain English
            </p>
          )}
        </div>

        {/* AI Search Bar */}
        {searchMode === 'ai' && (
          <div className="px-4 pb-3">
            <AISearchBar
              onResults={handleAIResults}
              onClear={handleAIClear}
            />
          </div>
        )}

        {/* Traditional Filters */}
        {searchMode === 'filters' && (
          <FilterBar 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            totalResults={total}
          />
        )}
      </div>

      {/* Selected community indicator */}
      {selectedCommunity && (
        <div className="bg-spyglass-orange/10 border-b border-spyglass-orange/20 px-4 py-2 flex items-center justify-between">
          <span className="text-sm">
            Showing listings in <strong>{selectedCommunity.name}</strong>
          </span>
          <button 
            onClick={() => setSelectedCommunity(null)}
            className="text-sm text-spyglass-orange hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* View mode toggle (mobile) */}
      <div className="md:hidden flex border-b border-gray-200 bg-white">
        {(['list', 'map'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              viewMode === mode 
                ? 'text-spyglass-orange border-b-2 border-spyglass-orange' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode === 'list' ? 'List' : 'Map'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Listings panel */}
        <div 
          className={`
            ${viewMode === 'map' ? 'hidden md:block' : ''} 
            ${viewMode === 'split' ? 'w-full md:w-1/2 lg:w-[45%]' : 'w-full'}
            overflow-y-auto listings-scroll bg-gray-50
          `}
        >
          {/* Sort dropdown */}
          <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${total.toLocaleString()} homes`}
            </span>
            <select
              value={filters.sort ?? 'date-desc'}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-spyglass-orange"
            >
              <option value="date-desc">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="sqft-desc">Sqft: High to Low</option>
            </select>
          </div>

          <ListingsGrid 
            listings={listings}
            selectedListing={selectedListing}
            hoveredListing={hoveredListing}
            onSelectListing={setSelectedListing}
            onHoverListing={setHoveredListing}
            isLoading={loading}
          />

          {/* Load more button */}
          {hasMore && !loading && (
            <div className="p-4 text-center">
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-spyglass-orange text-white rounded-lg hover:bg-spyglass-orange/90 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>

        {/* Map panel */}
        <div 
          className={`
            ${viewMode === 'list' ? 'hidden md:block' : ''} 
            ${viewMode === 'split' ? 'hidden md:block md:w-1/2 lg:w-[55%]' : 'w-full'}
            border-l border-gray-200
          `}
        >
          <Suspense fallback={<MapLoadingFallback />}>
            <LeafletMap 
              listings={listings}
              communities={austinCommunities}
              selectedListing={selectedListing}
              hoveredListing={hoveredListing}
              selectedCommunity={selectedCommunity}
              onSelectListing={setSelectedListing}
              onHoverListing={setHoveredListing}
              onSelectCommunity={handleSelectCommunity}
              onBoundsChange={setMapBounds}
            />
          </Suspense>
        </div>
      </div>

      {/* Listing detail overlay */}
      <ListingDetailOverlay 
        listing={selectedListing}
        isOpen={selectedListing !== null}
        onClose={() => {
          setSelectedListing(null);
          // Reset URL to search page
          window.history.pushState({}, '', '/');
        }}
        hasPrevious={selectedListing ? listings.findIndex(l => l.mlsNumber === selectedListing.mlsNumber) > 0 : false}
        hasNext={selectedListing ? listings.findIndex(l => l.mlsNumber === selectedListing.mlsNumber) < listings.length - 1 : false}
        onPrevious={() => {
          if (!selectedListing) return;
          const currentIdx = listings.findIndex(l => l.mlsNumber === selectedListing.mlsNumber);
          if (currentIdx > 0) {
            const prev = listings[currentIdx - 1];
            setSelectedListing(prev);
            window.history.pushState({}, '', `/listing/${prev.mlsNumber}`);
          }
        }}
        onNext={() => {
          if (!selectedListing) return;
          const currentIdx = listings.findIndex(l => l.mlsNumber === selectedListing.mlsNumber);
          if (currentIdx < listings.length - 1) {
            const next = listings[currentIdx + 1];
            setSelectedListing(next);
            window.history.pushState({}, '', `/listing/${next.mlsNumber}`);
          }
        }}
        onFilterByCity={(city) => {
          setFilters({ ...filters, city });
          window.history.pushState({}, '', '/');
        }}
        onFilterByZip={(zip) => {
          setFilters({ ...filters, zip });
          window.history.pushState({}, '', '/');
        }}
        onFilterByNeighborhood={(neighborhood) => {
          setFilters({ ...filters, neighborhood });
          window.history.pushState({}, '', '/');
        }}
      />
    </div>
  );
}

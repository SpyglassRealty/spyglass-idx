'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, AdjustmentsHorizontalIcon, BookmarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { FilterModal, FilterState, defaultFilters } from './FilterModal';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount?: number;
  onAISearchClick?: () => void;
  showAISearch?: boolean;
}

// Dropdown component
function FilterDropdown({
  label,
  children,
  hasValue,
}: {
  label: string;
  children: React.ReactNode;
  hasValue?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
          hasValue
            ? 'bg-teal-50 border-teal-300 text-teal-700'
            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
        }`}
      >
        <span className="font-medium">{label}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 min-w-[280px]">
          {children}
        </div>
      )}
    </div>
  );
}

// Price dropdown content
function PriceDropdown({
  minPrice,
  maxPrice,
  onChange,
  onClose,
}: {
  minPrice?: number;
  maxPrice?: number;
  onChange: (min?: number, max?: number) => void;
  onClose: () => void;
}) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);

  const priceOptions = [
    { label: 'No min', value: undefined },
    { label: '$100k', value: 100000 },
    { label: '$200k', value: 200000 },
    { label: '$300k', value: 300000 },
    { label: '$400k', value: 400000 },
    { label: '$500k', value: 500000 },
    { label: '$600k', value: 600000 },
    { label: '$750k', value: 750000 },
    { label: '$1M', value: 1000000 },
    { label: '$1.5M', value: 1500000 },
    { label: '$2M', value: 2000000 },
    { label: '$3M', value: 3000000 },
  ];

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Min Price</label>
          <select
            value={min ?? ''}
            onChange={(e) => setMin(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {priceOptions.map((opt, i) => (
              <option key={i} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Max Price</label>
          <select
            value={max ?? ''}
            onChange={(e) => setMax(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">No max</option>
            {priceOptions.slice(1).map((opt, i) => (
              <option key={i} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={() => {
          onChange(min, max);
          onClose();
        }}
        className="w-full py-2 bg-spyglass-orange text-white font-medium rounded-lg"
      >
        Apply
      </button>
    </div>
  );
}

// Beds/Baths dropdown content
function BedsBathsDropdown({
  minBeds,
  minBaths,
  onChange,
  onClose,
}: {
  minBeds?: number;
  minBaths?: number;
  onChange: (beds?: number, baths?: number) => void;
  onClose: () => void;
}) {
  const [beds, setBeds] = useState(minBeds);
  const [baths, setBaths] = useState(minBaths);

  const bedOptions = [
    { label: 'Any', value: undefined },
    { label: 'Studio', value: 0 },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
    { label: '5+', value: 5 },
  ];

  const bathOptions = [
    { label: 'Any', value: undefined },
    { label: '1+', value: 1 },
    { label: '1.5+', value: 1.5 },
    { label: '2+', value: 2 },
    { label: '2.5+', value: 2.5 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Beds</label>
        <div className="flex flex-wrap gap-1">
          {bedOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setBeds(opt.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                beds === opt.value
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Baths</label>
        <div className="flex flex-wrap gap-1">
          {bathOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setBaths(opt.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                baths === opt.value
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => {
          onChange(beds, baths);
          onClose();
        }}
        className="w-full py-2 bg-spyglass-orange text-white font-medium rounded-lg"
      >
        Apply
      </button>
    </div>
  );
}

// For Sale dropdown
function ForSaleDropdown({
  listingType,
  onChange,
  onClose,
}: {
  listingType: 'sale' | 'rent';
  onChange: (type: 'sale' | 'rent') => void;
  onClose: () => void;
}) {
  return (
    <div className="py-2">
      <button
        onClick={() => {
          onChange('sale');
          onClose();
        }}
        className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
          listingType === 'sale' ? 'text-teal-600 font-medium' : 'text-gray-700'
        }`}
      >
        For sale
      </button>
      <button
        onClick={() => {
          onChange('rent');
          onClose();
        }}
        className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
          listingType === 'rent' ? 'text-teal-600 font-medium' : 'text-gray-700'
        }`}
      >
        For rent
      </button>
    </div>
  );
}

export function FilterBar({ 
  filters, 
  onFiltersChange, 
  totalCount,
  onAISearchClick,
  showAISearch = true,
}: FilterBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const formatPriceLabel = () => {
    if (filters.minPrice && filters.maxPrice) {
      return `$${(filters.minPrice / 1000).toFixed(0)}k - $${(filters.maxPrice / 1000).toFixed(0)}k`;
    }
    if (filters.minPrice) {
      return `$${(filters.minPrice / 1000).toFixed(0)}k+`;
    }
    if (filters.maxPrice) {
      return `Up to $${(filters.maxPrice / 1000).toFixed(0)}k`;
    }
    return 'Price';
  };

  const formatBedsLabel = () => {
    const parts = [];
    if (filters.minBeds !== undefined) {
      parts.push(filters.minBeds === 0 ? 'Studio+' : `${filters.minBeds}+ bd`);
    }
    if (filters.minBaths !== undefined) {
      parts.push(`${filters.minBaths}+ ba`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Beds/baths';
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minBeds || filters.minBaths) count++;
    if (filters.homeTypes?.length) count++;
    if (filters.minSqft || filters.maxSqft) count++;
    if (filters.features?.length) count++;
    // Add more as needed
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* AI Search button */}
        {showAISearch && (
          <button
            onClick={onAISearchClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-gray-400 transition-colors"
          >
            <SparklesIcon className="w-4 h-4 text-spyglass-orange" />
            <span className="font-medium text-gray-700">AI Search</span>
          </button>
        )}

        {/* For Sale dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-gray-400"
          >
            <span className="font-medium text-gray-700">
              {filters.listingType === 'sale' ? 'For sale' : 'For rent'}
            </span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {openDropdown === 'type' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 min-w-[150px]">
              <ForSaleDropdown
                listingType={filters.listingType}
                onChange={(type) => onFiltersChange({ ...filters, listingType: type })}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
          )}
        </div>

        {/* Price dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
              filters.minPrice || filters.maxPrice
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="font-medium">{formatPriceLabel()}</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {openDropdown === 'price' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
              <PriceDropdown
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onChange={(min, max) => onFiltersChange({ ...filters, minPrice: min, maxPrice: max })}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
          )}
        </div>

        {/* Beds/Baths dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'beds' ? null : 'beds')}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
              filters.minBeds !== undefined || filters.minBaths !== undefined
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="font-medium">{formatBedsLabel()}</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {openDropdown === 'beds' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
              <BedsBathsDropdown
                minBeds={filters.minBeds}
                minBaths={filters.minBaths}
                onChange={(beds, baths) => onFiltersChange({ ...filters, minBeds: beds, minBaths: baths })}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
          )}
        </div>

        {/* Filters button */}
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            activeCount > 0
              ? 'bg-teal-50 border-teal-300 text-teal-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          <span className="font-medium">Filters</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-xs">
              {activeCount}
            </span>
          )}
        </button>

        {/* Save search button */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spyglass-orange text-white font-medium hover:bg-spyglass-orange/90 transition-colors"
        >
          <BookmarkIcon className="w-5 h-5" />
          <span>Save search</span>
        </button>
      </div>

      {/* Close dropdown on outside click */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        filters={filters}
        onApply={onFiltersChange}
        totalCount={totalCount}
      />
    </>
  );
}

export { defaultFilters };
export type { FilterState };

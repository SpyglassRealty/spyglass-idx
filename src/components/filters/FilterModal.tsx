'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  BuildingOffice2Icon,
  HomeModernIcon,
  MapIcon,
  TruckIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';

export interface FilterState {
  // Listing type
  listingType: 'sale' | 'rent';
  
  // Price
  minPrice?: number;
  maxPrice?: number;
  
  // Beds/Baths
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  
  // Home types
  homeTypes: string[];
  
  // Status
  statuses: string[];
  
  // Days on market
  maxDaysOnMarket?: number;
  
  // Property details
  minSqft?: number;
  maxSqft?: number;
  minLotSize?: number;
  maxLotSize?: number;
  minStories?: number;
  maxStories?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  exclude55Plus?: boolean;
  
  // Home features
  minGarage?: number;
  poolType?: string;
  includeOutdoorParking?: boolean;
  features: string[];
  keywords?: string;
  
  // Cost/finance
  maxHoa?: number;
  maxPropertyTax?: number;
  minPricePerSqft?: number;
  maxPricePerSqft?: number;
  financing?: string;
  priceReduced?: boolean;
  
  // Listing type filters
  byAgent?: boolean;
  byOwner?: boolean;
  newConstruction?: boolean;
  foreclosures?: boolean;
  excludeShortSales?: boolean;
  
  // Open house
  openHouseOnly?: boolean;
  virtualTourOnly?: boolean;
}

const defaultFilters: FilterState = {
  listingType: 'sale',
  homeTypes: [],
  statuses: ['Active', 'Coming Soon'],
  features: [],
  byAgent: true,
  byOwner: true,
  newConstruction: true,
  foreclosures: true,
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  totalCount?: number;
}

// Reusable button group component
function ButtonGroup({ 
  options, 
  value, 
  onChange, 
  allowMultiple = false 
}: { 
  options: { label: string; value: string | number }[];
  value: (string | number)[] | string | number | undefined;
  onChange: (value: any) => void;
  allowMultiple?: boolean;
}) {
  const selectedValues = Array.isArray(value) ? value : value !== undefined ? [value] : [];
  
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const isSelected = selectedValues.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => {
              if (allowMultiple) {
                if (isSelected) {
                  onChange(selectedValues.filter(v => v !== opt.value));
                } else {
                  onChange([...selectedValues, opt.value]);
                }
              } else {
                onChange(opt.value === value ? undefined : opt.value);
              }
            }}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Collapsible section
function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-t border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

// Select dropdown
function SelectDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select'
}: {
  label?: string;
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  options: { label: string; value: string | number }[];
  placeholder?: string;
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Checkbox
function Checkbox({
  label,
  checked,
  onChange,
  info
}: {
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
  info?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked ?? false}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
      {info && (
        <span className="text-gray-400 text-xs">ⓘ</span>
      )}
    </label>
  );
}

// Home type card
function HomeTypeCard({
  icon: Icon,
  label,
  selected,
  onClick
}: {
  icon: any;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
        selected
          ? 'border-teal-600 bg-teal-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-teal-600' : 'text-gray-600'}`} />
      <span className={`text-sm ${selected ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}

export function FilterModal({ isOpen, onClose, filters: initialFilters, onApply, totalCount }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const toggleHomeType = (type: string) => {
    const current = filters.homeTypes || [];
    if (current.includes(type)) {
      updateFilter('homeTypes', current.filter(t => t !== type));
    } else {
      updateFilter('homeTypes', [...current, type]);
    }
  };
  
  const toggleFeature = (feature: string) => {
    const current = filters.features || [];
    if (current.includes(feature)) {
      updateFilter('features', current.filter(f => f !== feature));
    } else {
      updateFilter('features', [...current, feature]);
    }
  };
  
  const toggleStatus = (status: string) => {
    const current = filters.statuses || [];
    if (current.includes(status)) {
      updateFilter('statuses', current.filter(s => s !== status));
    } else {
      updateFilter('statuses', [...current, status]);
    }
  };
  
  const handleReset = () => {
    setFilters(defaultFilters);
  };
  
  const handleApply = () => {
    onApply(filters);
    onClose();
  };
  
  if (!isOpen) return null;
  
  const homeTypes = [
    { type: 'House', icon: HomeIcon },
    { type: 'Townhouse', icon: HomeModernIcon },
    { type: 'Condo', icon: BuildingOfficeIcon },
    { type: 'Land', icon: MapIcon },
    { type: 'Multi-family', icon: BuildingOffice2Icon },
    { type: 'Mobile', icon: TruckIcon },
    { type: 'Co-op', icon: UserGroupIcon },
    { type: 'Other', icon: QuestionMarkCircleIcon },
  ];
  
  const featureOptions = [
    'Air conditioning', 'Basement', 'Waterfront', 'Washer/dryer hookup',
    'Has a view', 'Pets allowed', 'Fireplace', 'Primary bedroom on main floor',
    'Fixer-upper', 'RV parking', 'Guest house', 'Green home',
    'Elevator', 'Accessible home'
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          {/* Listing type toggle */}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => updateFilter('listingType', 'sale')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.listingType === 'sale'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For sale
            </button>
            <button
              onClick={() => updateFilter('listingType', 'rent')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.listingType === 'rent'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For rent
            </button>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Price */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Enter min"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <span className="flex items-center text-gray-400">–</span>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Enter max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Beds */}
          <div className="py-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Beds</h3>
            <p className="text-sm text-gray-500 mb-3">Tap two numbers to select a range</p>
            <ButtonGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Studio', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5+', value: 5 },
              ]}
              value={filters.minBeds}
              onChange={(val) => updateFilter('minBeds', val === 'any' ? undefined : val)}
            />
          </div>
          
          {/* Baths */}
          <div className="py-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Baths</h3>
            <ButtonGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: '1+', value: 1 },
                { label: '1.5+', value: 1.5 },
                { label: '2+', value: 2 },
                { label: '2.5+', value: 2.5 },
                { label: '3+', value: 3 },
                { label: '4+', value: 4 },
              ]}
              value={filters.minBaths}
              onChange={(val) => updateFilter('minBaths', val === 'any' ? undefined : val)}
            />
          </div>
          
          {/* Home type */}
          <div className="py-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Home type</h3>
            <div className="grid grid-cols-4 gap-2">
              {homeTypes.map(({ type, icon }) => (
                <HomeTypeCard
                  key={type}
                  icon={icon}
                  label={type}
                  selected={filters.homeTypes?.includes(type) ?? false}
                  onClick={() => toggleHomeType(type)}
                />
              ))}
            </div>
          </div>
          
          {/* Status */}
          <div className="py-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                <div className="space-y-3">
                  <Checkbox
                    label="Coming soon"
                    checked={filters.statuses?.includes('Coming Soon')}
                    onChange={(checked) => toggleStatus('Coming Soon')}
                  />
                  <Checkbox
                    label="Active"
                    checked={filters.statuses?.includes('Active')}
                    onChange={(checked) => toggleStatus('Active')}
                  />
                  <Checkbox
                    label="Under contract/pending"
                    checked={filters.statuses?.includes('Pending')}
                    onChange={(checked) => toggleStatus('Pending')}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time on market</h3>
                <SelectDropdown
                  value={filters.maxDaysOnMarket}
                  onChange={(val) => updateFilter('maxDaysOnMarket', val as number | undefined)}
                  options={[
                    { label: '1 day', value: 1 },
                    { label: '7 days', value: 7 },
                    { label: '14 days', value: 14 },
                    { label: '30 days', value: 30 },
                    { label: '90 days', value: 90 },
                    { label: '6 months', value: 180 },
                    { label: '1 year', value: 365 },
                  ]}
                  placeholder="No max"
                />
              </div>
            </div>
          </div>
          
          {/* Property details */}
          <CollapsibleSection title="Property details" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Square feet</label>
                <div className="flex gap-2 items-center">
                  <SelectDropdown
                    value={filters.minSqft}
                    onChange={(val) => updateFilter('minSqft', val as number | undefined)}
                    options={[500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000].map(v => ({ label: v.toLocaleString(), value: v }))}
                    placeholder="No min"
                  />
                  <span className="text-gray-400">–</span>
                  <SelectDropdown
                    value={filters.maxSqft}
                    onChange={(val) => updateFilter('maxSqft', val as number | undefined)}
                    options={[1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000].map(v => ({ label: v.toLocaleString(), value: v }))}
                    placeholder="No max"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lot size</label>
                <div className="flex gap-2 items-center">
                  <SelectDropdown
                    value={filters.minLotSize}
                    onChange={(val) => updateFilter('minLotSize', val as number | undefined)}
                    options={[2000, 4500, 6500, 8000, 10890, 21780, 43560, 87120, 217800].map(v => ({ 
                      label: v >= 43560 ? `${(v/43560).toFixed(1)} acres` : `${v.toLocaleString()} sqft`, 
                      value: v 
                    }))}
                    placeholder="No min"
                  />
                  <span className="text-gray-400">–</span>
                  <SelectDropdown
                    value={filters.maxLotSize}
                    onChange={(val) => updateFilter('maxLotSize', val as number | undefined)}
                    options={[4500, 6500, 8000, 10890, 21780, 43560, 87120, 217800, 435600].map(v => ({ 
                      label: v >= 43560 ? `${(v/43560).toFixed(1)} acres` : `${v.toLocaleString()} sqft`, 
                      value: v 
                    }))}
                    placeholder="No max"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stories</label>
                <div className="flex gap-2 items-center">
                  <SelectDropdown
                    value={filters.minStories}
                    onChange={(val) => updateFilter('minStories', val as number | undefined)}
                    options={[1, 2, 3, 4, 5].map(v => ({ label: String(v), value: v }))}
                    placeholder="No min"
                  />
                  <span className="text-gray-400">–</span>
                  <SelectDropdown
                    value={filters.maxStories}
                    onChange={(val) => updateFilter('maxStories', val as number | undefined)}
                    options={[1, 2, 3, 4, 5].map(v => ({ label: String(v), value: v }))}
                    placeholder="No max"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year built</label>
                <div className="flex gap-2 items-center">
                  <SelectDropdown
                    value={filters.minYearBuilt}
                    onChange={(val) => updateFilter('minYearBuilt', val as number | undefined)}
                    options={[2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1900].map(v => ({ label: String(v), value: v }))}
                    placeholder="No min"
                  />
                  <span className="text-gray-400">–</span>
                  <SelectDropdown
                    value={filters.maxYearBuilt}
                    onChange={(val) => updateFilter('maxYearBuilt', val as number | undefined)}
                    options={[2025, 2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950].map(v => ({ label: String(v), value: v }))}
                    placeholder="No max"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Checkbox
                label="Exclude 55+ communities"
                checked={filters.exclude55Plus}
                onChange={(checked) => updateFilter('exclude55Plus', checked)}
              />
            </div>
          </CollapsibleSection>
          
          {/* Home features */}
          <CollapsibleSection title="Home features" defaultOpen={false}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Garage spots</label>
                  <ButtonGroup
                    options={[
                      { label: 'Any', value: 'any' },
                      { label: '1+', value: 1 },
                      { label: '2+', value: 2 },
                      { label: '3+', value: 3 },
                      { label: '4+', value: 4 },
                      { label: '5+', value: 5 },
                    ]}
                    value={filters.minGarage}
                    onChange={(val) => updateFilter('minGarage', val === 'any' ? undefined : val)}
                  />
                  <div className="mt-2">
                    <Checkbox
                      label="Include outdoor parking"
                      checked={filters.includeOutdoorParking}
                      onChange={(checked) => updateFilter('includeOutdoorParking', checked)}
                      info
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pool type</label>
                  <SelectDropdown
                    value={filters.poolType}
                    onChange={(val) => updateFilter('poolType', val as string | undefined)}
                    options={[
                      { label: 'Any pool', value: 'any' },
                      { label: 'Private pool', value: 'private' },
                      { label: 'Community pool', value: 'community' },
                    ]}
                    placeholder="Select one"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4">
                {featureOptions.map(feature => (
                  <Checkbox
                    key={feature}
                    label={feature}
                    checked={filters.features?.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                ))}
              </div>
              
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Keyword search</label>
                <input
                  type="text"
                  placeholder="e.g. office, balcony, modern"
                  value={filters.keywords || ''}
                  onChange={(e) => updateFilter('keywords', e.target.value || undefined)}
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </CollapsibleSection>
          
          {/* Cost/finance */}
          <CollapsibleSection title="Cost/finance" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown
                label="HOA fees"
                value={filters.maxHoa}
                onChange={(val) => updateFilter('maxHoa', val as number | undefined)}
                options={[100, 200, 300, 400, 500, 750, 1000, 1500, 2000].map(v => ({ label: `$${v}/mo`, value: v }))}
                placeholder="No max"
              />
              <SelectDropdown
                label="Property taxes"
                value={filters.maxPropertyTax}
                onChange={(val) => updateFilter('maxPropertyTax', val as number | undefined)}
                options={[250, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000].map(v => ({ label: `$${v}/mo`, value: v }))}
                placeholder="No max"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price/sq. ft.</label>
                <div className="flex gap-2 items-center">
                  <SelectDropdown
                    value={filters.minPricePerSqft}
                    onChange={(val) => updateFilter('minPricePerSqft', val as number | undefined)}
                    options={[50, 100, 150, 200, 250, 300, 400, 500].map(v => ({ label: `$${v}`, value: v }))}
                    placeholder="No min"
                  />
                  <span className="text-gray-400">–</span>
                  <SelectDropdown
                    value={filters.maxPricePerSqft}
                    onChange={(val) => updateFilter('maxPricePerSqft', val as number | undefined)}
                    options={[100, 150, 200, 250, 300, 400, 500, 750, 1000].map(v => ({ label: `$${v}`, value: v }))}
                    placeholder="No max"
                  />
                </div>
              </div>
              <SelectDropdown
                label="Accepted financing"
                value={filters.financing}
                onChange={(val) => updateFilter('financing', val as string | undefined)}
                options={[
                  { label: 'FHA', value: 'fha' },
                  { label: 'VA', value: 'va' },
                  { label: 'Cash only', value: 'cash' },
                ]}
                placeholder="Select one"
              />
            </div>
            <div className="mt-4">
              <Checkbox
                label="Price reduced"
                checked={filters.priceReduced}
                onChange={(checked) => updateFilter('priceReduced', checked)}
              />
            </div>
          </CollapsibleSection>
          
          {/* Listing type */}
          <CollapsibleSection title="Listing type" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <Checkbox
                label="By agent"
                checked={filters.byAgent}
                onChange={(checked) => updateFilter('byAgent', checked)}
              />
              <Checkbox
                label="Foreclosures"
                checked={filters.foreclosures}
                onChange={(checked) => updateFilter('foreclosures', checked)}
              />
              <Checkbox
                label="By owner (FSBO)"
                checked={filters.byOwner}
                onChange={(checked) => updateFilter('byOwner', checked)}
              />
              <Checkbox
                label="Exclude short sales"
                checked={filters.excludeShortSales}
                onChange={(checked) => updateFilter('excludeShortSales', checked)}
                info
              />
              <Checkbox
                label="New construction"
                checked={filters.newConstruction}
                onChange={(checked) => updateFilter('newConstruction', checked)}
              />
            </div>
          </CollapsibleSection>
          
          {/* Open house & tour */}
          <CollapsibleSection title="Open house & tour" defaultOpen={false}>
            <div className="space-y-3">
              <Checkbox
                label="Open house this weekend"
                checked={filters.openHouseOnly}
                onChange={(checked) => updateFilter('openHouseOnly', checked)}
              />
              <Checkbox
                label="3D walkthrough / Virtual tour"
                checked={filters.virtualTourOnly}
                onChange={(checked) => updateFilter('virtualTourOnly', checked)}
              />
            </div>
          </CollapsibleSection>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleReset}
            className="text-teal-600 font-medium hover:underline"
          >
            Reset all
          </button>
          <button
            onClick={handleApply}
            className="px-8 py-3 bg-spyglass-orange text-white font-semibold rounded-lg hover:bg-spyglass-orange/90 transition-colors"
          >
            See {totalCount?.toLocaleString() ?? ''} homes
          </button>
        </div>
      </div>
    </>
  );
}

export { defaultFilters };

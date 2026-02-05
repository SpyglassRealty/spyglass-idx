'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatNumber } from '@/lib/utils';
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CommunityStats {
  activeListings: number;
  medianPrice: number;
  avgPrice: number;
  pricePerSqft: number;
  avgDaysOnMarket: number;
  minPrice: number;
  maxPrice: number;
  singleFamilyCount: number;
  condoCount: number;
  townhouseCount: number;
  avgBedrooms: number;
  avgBathrooms: number;
  avgSqft: number;
  under500k: number;
  range500kTo750k: number;
  range750kTo1m: number;
  over1m: number;
}

interface DemographicData {
  population: number;
  households: number;
  medianHouseholdIncome: number;
  medianAge: number;
  collegeEducatedPct: number;
  homeownershipRate: number;
  medianHomeValue: number;
  averageHouseholdSize: number;
  unemploymentRate: number;
  under18Pct: number;
}

interface CommunityStatsProps {
  communitySlug: string;
  communityName: string;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string; 
  value: string | number; 
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-red-600" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function PriceRangeBar({ stats }: { stats: CommunityStats }) {
  const total = stats.under500k + stats.range500kTo750k + stats.range750kTo1m + stats.over1m;
  if (total === 0) return null;

  const segments = [
    { label: 'Under $500K', count: stats.under500k, color: 'bg-green-500' },
    { label: '$500K-$750K', count: stats.range500kTo750k, color: 'bg-blue-500' },
    { label: '$750K-$1M', count: stats.range750kTo1m, color: 'bg-purple-500' },
    { label: '$1M+', count: stats.over1m, color: 'bg-red-500' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-3">Price Distribution</h3>
      <div className="h-4 rounded-full overflow-hidden flex mb-3">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`${seg.color} transition-all`}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded ${seg.color}`} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="text-gray-900 font-medium ml-auto">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PropertyTypeMix({ stats }: { stats: CommunityStats }) {
  const types = [
    { label: 'Single Family', count: stats.singleFamilyCount, icon: '🏠' },
    { label: 'Condo', count: stats.condoCount, icon: '🏢' },
    { label: 'Townhouse', count: stats.townhouseCount, icon: '🏘️' },
  ].filter(t => t.count > 0);

  if (types.length === 0) return null;

  const total = types.reduce((a, t) => a + t.count, 0);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-3">Property Types</h3>
      <div className="space-y-2">
        {types.map((type, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xl">{type.icon}</span>
            <span className="text-gray-700 flex-1">{type.label}</span>
            <span className="text-gray-500 text-sm">{Math.round(type.count / total * 100)}%</span>
            <span className="font-medium text-gray-900 w-8 text-right">{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommunityStats({ communitySlug, communityName }: CommunityStatsProps) {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [demographics, setDemographics] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/communities/${communitySlug}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [communitySlug]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.activeListings === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">No active listings in {communityName} at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Market Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={HomeIcon}
            label="Active Listings"
            value={stats.activeListings}
          />
          <StatCard
            icon={CurrencyDollarIcon}
            label="Median Price"
            value={formatPrice(stats.medianPrice)}
          />
          <StatCard
            icon={ChartBarIcon}
            label="Price/Sqft"
            value={`$${stats.pricePerSqft}`}
          />
          <StatCard
            icon={ClockIcon}
            label="Avg Days on Market"
            value={stats.avgDaysOnMarket}
            subtext="days"
          />
        </div>
      </div>

      {/* Property Details */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Property Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={HomeIcon}
            label="Avg Size"
            value={`${formatNumber(stats.avgSqft)} sqft`}
          />
          <StatCard
            icon={HomeIcon}
            label="Avg Bedrooms"
            value={stats.avgBedrooms}
          />
          <StatCard
            icon={HomeIcon}
            label="Avg Bathrooms"
            value={stats.avgBathrooms}
          />
          <StatCard
            icon={CurrencyDollarIcon}
            label="Price Range"
            value={`${formatPrice(stats.minPrice)} - ${formatPrice(stats.maxPrice)}`}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <PriceRangeBar stats={stats} />
        <PropertyTypeMix stats={stats} />
      </div>

      {/* Demographics placeholder - will add Census data */}
      {demographics && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Demographics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={UserGroupIcon}
              label="Population"
              value={formatNumber(demographics.population)}
            />
            <StatCard
              icon={CurrencyDollarIcon}
              label="Median Income"
              value={formatPrice(demographics.medianHouseholdIncome)}
            />
            <StatCard
              icon={AcademicCapIcon}
              label="College Educated"
              value={`${demographics.collegeEducatedPct}%`}
            />
            <StatCard
              icon={BuildingOfficeIcon}
              label="Homeownership"
              value={`${demographics.homeownershipRate}%`}
            />
          </div>
        </div>
      )}

      {/* Source attribution */}
      <p className="text-xs text-gray-400 text-center">
        Market data from Austin MLS. Updated daily.
      </p>
    </div>
  );
}

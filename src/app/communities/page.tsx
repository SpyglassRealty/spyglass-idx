'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { 
  COMMUNITIES, 
  CommunityPolygon 
} from '@/data/communities-polygons';

// Derived filtered lists
const FEATURED_COMMUNITIES = COMMUNITIES.filter(c => c.featured);
const TRAVIS_COMMUNITIES = COMMUNITIES.filter(c => c.county === 'Travis');
const WILLIAMSON_COMMUNITIES = COMMUNITIES.filter(c => c.county === 'Williamson');
const HAYS_COMMUNITIES = COMMUNITIES.filter(c => c.county === 'Hays');
import { MagnifyingGlassIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline';

type FilterTab = 'all' | 'featured' | 'travis' | 'williamson' | 'hays';

function CommunityCard({ community }: { community: CommunityPolygon }) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push(`/communities/${community.slug}`)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-4 text-left group border border-gray-100 hover:border-red-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
          {community.name}
        </h3>
        {community.featured && (
          <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
        )}
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <MapPinIcon className="w-4 h-4" />
        <span>{community.county} County</span>
      </div>
    </button>
  );
}

function CommunitiesContent() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredCommunities = useMemo(() => {
    let communities: CommunityPolygon[];
    
    switch (activeTab) {
      case 'featured':
        communities = FEATURED_COMMUNITIES;
        break;
      case 'travis':
        communities = TRAVIS_COMMUNITIES;
        break;
      case 'williamson':
        communities = WILLIAMSON_COMMUNITIES;
        break;
      case 'hays':
        communities = HAYS_COMMUNITIES;
        break;
      default:
        communities = COMMUNITIES;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      communities = communities.filter(c => 
        c.name.toLowerCase().includes(query)
      );
    }
    
    return communities.sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, searchQuery]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: COMMUNITIES.length },
    { id: 'featured', label: 'Featured', count: FEATURED_COMMUNITIES.length },
    { id: 'travis', label: 'Travis County', count: TRAVIS_COMMUNITIES.length },
    { id: 'williamson', label: 'Williamson', count: WILLIAMSON_COMMUNITIES.length },
    { id: 'hays', label: 'Hays County', count: HAYS_COMMUNITIES.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {!isEmbed && <Header />}

      {/* Hero */}
      <div className="bg-gray-900 text-white">
        <div className={`max-w-7xl mx-auto px-4 ${isEmbed ? 'py-6' : 'py-12 md:py-16'}`}>
          <h1 className={`${isEmbed ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold mb-3`}>
            Austin Area Communities
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Explore {COMMUNITIES.length} neighborhoods across the Austin metro area. 
            Find your perfect community with real-time MLS listings.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 ${activeTab === tab.id ? 'text-red-200' : 'text-gray-500'}`}>
                    ({tab.count})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No communities found matching &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-red-600 hover:text-red-700 font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {filteredCommunities.length} communities
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCommunities.map(community => (
                <CommunityCard key={community.slug} community={community} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Powered by footer for embeds */}
      {isEmbed && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-500">
          Powered by{' '}
          <a 
            href="https://spyglassrealty.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Spyglass Realty
          </a>
        </div>
      )}
    </div>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><Header /><div className="p-8 text-center">Loading...</div></div>}>
      <CommunitiesContent />
    </Suspense>
  );
}

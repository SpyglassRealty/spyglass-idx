'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { getCommunityBySlug } from '@/data/communities-polygons';
import { Listing } from '@/types/listing';
import { formatPrice } from '@/lib/utils';
import { ArrowLeftIcon, MapPinIcon, HomeIcon, CurrencyDollarIcon, PhoneIcon, EnvelopeIcon, ChartBarIcon, InformationCircleIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import ContactModal from '@/components/forms/ContactModal';
import CommunityStats from '@/components/community/CommunityStats';
import CommunityDescription from '@/components/community/CommunityDescription';

// Lazy load map
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

type TabType = 'listings' | 'market' | 'about';

function CommunityDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isEmbed = searchParams.get('embed') === 'true';
  const initialTab = (searchParams.get('tab') as TabType) || 'listings';

  const community = getCommunityBySlug(slug);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [stats, setStats] = useState<any>(null);

  // Fetch listings for this community using polygon
  useEffect(() => {
    if (!community?.polygon) return;

    const fetchListings = async () => {
      setLoading(true);
      try {
        const polygonString = community.polygon
          .map(([lng, lat]) => `${lat},${lng}`)
          .join(';');

        const response = await fetch(`/api/listings?polygon=${encodeURIComponent(polygonString)}&pageSize=100`);

        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [community]);

  // Fetch community stats
  useEffect(() => {
    if (!slug) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/communities/${slug}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [slug]);

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!isEmbed && <Header />}
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
          <p className="text-gray-600 mb-8">We couldn&apos;t find this community.</p>
          <button
            onClick={() => router.push('/communities')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  const avgPrice = listings.length > 0
    ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length
    : 0;

  const mapCommunity = {
    id: community.slug,
    name: community.name,
    slug: community.slug,
    coordinates: community.displayPolygon.map(([lat, lng]) => ({ lat, lng })),
  };

  const tabs = [
    { id: 'listings' as TabType, label: 'Listings', icon: Squares2X2Icon, count: total },
    { id: 'market' as TabType, label: 'Market Data', icon: ChartBarIcon },
    { id: 'about' as TabType, label: 'About', icon: InformationCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isEmbed && <Header />}

      {/* Hero */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 to-gray-900" />
        
        <div className={`relative max-w-7xl mx-auto px-4 ${isEmbed ? 'py-4' : 'py-8 md:py-12'}`}>
          {!isEmbed && (
            <button
              onClick={() => router.push('/communities')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              All Communities
            </button>
          )}

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className={`${isEmbed ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold mb-2`}>
                Homes for Sale in {community.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{community.county} County, Austin TX</span>
                </div>
                {!loading && (
                  <>
                    <div className="flex items-center gap-1">
                      <HomeIcon className="w-4 h-4" />
                      <span>{total} Active Listings</span>
                    </div>
                    {avgPrice > 0 && (
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>Median: {formatPrice(stats?.medianPrice || avgPrice)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="tel:7377274889"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <PhoneIcon className="w-5 h-5" />
                <span className="hidden sm:inline">737-727-4889</span>
              </a>
              <button
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                <EnvelopeIcon className="w-5 h-5" />
                Contact Agent
              </button>
            </div>
          </div>

          {/* Tabs */}
          {!isEmbed && (
            <div className="flex gap-1 mt-6 border-b border-white/20 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-white border-red-500'
                      : 'text-white/60 hover:text-white/80 border-transparent'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-red-500' : 'bg-white/20'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <div className="flex-1 flex overflow-hidden" style={{ height: isEmbed ? 'calc(100vh - 100px)' : 'calc(100vh - 240px)' }}>
          <div className="w-full md:w-1/2 lg:w-[45%] overflow-y-auto bg-gray-50">
            <div className="sticky top-0 bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between z-10">
              <span className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${total} homes in ${community.name}`}
              </span>
            </div>

            <ListingsGrid
              listings={listings}
              selectedListing={selectedListing}
              hoveredListing={hoveredListing}
              onSelectListing={setSelectedListing}
              onHoverListing={setHoveredListing}
              isLoading={loading}
            />
          </div>

          <div className="hidden md:block md:w-1/2 lg:w-[55%] border-l border-gray-200">
            <Suspense fallback={<MapLoadingFallback />}>
              <LeafletMap
                listings={listings}
                communities={[mapCommunity]}
                selectedListing={selectedListing}
                hoveredListing={hoveredListing}
                selectedCommunity={mapCommunity}
                onSelectListing={setSelectedListing}
                onHoverListing={setHoveredListing}
              />
            </Suspense>
          </div>
        </div>
      )}

      {activeTab === 'market' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <CommunityStats communitySlug={slug} communityName={community.name} />
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <CommunityDescription 
              name={community.name} 
              county={community.county} 
              stats={stats}
            />

            {/* Map preview */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{community.name} Boundaries</h2>
              <div className="h-96 rounded-xl overflow-hidden border border-gray-200">
                <Suspense fallback={<MapLoadingFallback />}>
                  <LeafletMap
                    listings={[]}
                    communities={[mapCommunity]}
                    selectedCommunity={mapCommunity}
                  />
                </Suspense>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 bg-red-50 rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Ready to explore {community.name}?
              </h3>
              <p className="text-gray-600 mb-4">
                Our agents know this neighborhood inside and out. Let us help you find your perfect home.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="tel:7377274889"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <PhoneIcon className="w-5 h-5" />
                  Call 737-727-4889
                </a>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                  Send a Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        communityName={community.name}
        variant="info"
        title={`Interested in ${community.name}?`}
      />
    </div>
  );
}

export default function CommunityDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><Header /><div className="p-8 text-center">Loading community...</div></div>}>
      <CommunityDetailContent />
    </Suspense>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { getCommunityBySlug } from '@/data/communities-polygons';
import { searchListings } from '@/lib/repliers-api';

export interface CommunityStats {
  // Market stats
  activeListings: number;
  medianPrice: number;
  avgPrice: number;
  pricePerSqft: number;
  avgDaysOnMarket: number;
  // Price range
  minPrice: number;
  maxPrice: number;
  // Property mix
  singleFamilyCount: number;
  condoCount: number;
  townhouseCount: number;
  // Size stats
  avgBedrooms: number;
  avgBathrooms: number;
  avgSqft: number;
  // Price tiers
  under500k: number;
  range500kTo750k: number;
  range750kTo1m: number;
  over1m: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const community = getCommunityBySlug(slug);

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Fetch listings within the polygon
    const polygonString = community.polygon
      .map(([lng, lat]) => `${lat},${lng}`)
      .join(';');

    const { listings, total } = await searchListings({
      polygon: community.polygon.map(([lng, lat]) => ({ lat, lng })),
      pageSize: 200,
    });

    if (listings.length === 0) {
      return NextResponse.json({
        stats: {
          activeListings: 0,
          medianPrice: 0,
          avgPrice: 0,
          pricePerSqft: 0,
          avgDaysOnMarket: 0,
          minPrice: 0,
          maxPrice: 0,
          singleFamilyCount: 0,
          condoCount: 0,
          townhouseCount: 0,
          avgBedrooms: 0,
          avgBathrooms: 0,
          avgSqft: 0,
          under500k: 0,
          range500kTo750k: 0,
          range750kTo1m: 0,
          over1m: 0,
        } as CommunityStats
      });
    }

    // Calculate statistics
    const prices = listings.map(l => l.price).sort((a, b) => a - b);
    const medianPrice = prices[Math.floor(prices.length / 2)];
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    const sqftListings = listings.filter(l => l.sqft > 0);
    const totalSqft = sqftListings.reduce((a, l) => a + l.sqft, 0);
    const avgSqft = sqftListings.length > 0 ? Math.round(totalSqft / sqftListings.length) : 0;
    
    const pricePerSqft = sqftListings.length > 0
      ? Math.round(sqftListings.reduce((a, l) => a + l.price / l.sqft, 0) / sqftListings.length)
      : 0;

    const avgDaysOnMarket = Math.round(
      listings.reduce((a, l) => a + (l.daysOnMarket || 0), 0) / listings.length
    );

    const avgBedrooms = Math.round(
      listings.reduce((a, l) => a + l.bedrooms, 0) / listings.length * 10
    ) / 10;

    const avgBathrooms = Math.round(
      listings.reduce((a, l) => a + l.bathrooms, 0) / listings.length * 10
    ) / 10;

    // Property type counts
    const singleFamilyCount = listings.filter(l => 
      l.propertyType === 'Single Family' || l.propertyType?.toLowerCase().includes('single')
    ).length;
    const condoCount = listings.filter(l => 
      l.propertyType === 'Condo' || l.propertyType?.toLowerCase().includes('condo')
    ).length;
    const townhouseCount = listings.filter(l => 
      l.propertyType === 'Townhouse' || l.propertyType?.toLowerCase().includes('town')
    ).length;

    // Price tier counts
    const under500k = listings.filter(l => l.price < 500000).length;
    const range500kTo750k = listings.filter(l => l.price >= 500000 && l.price < 750000).length;
    const range750kTo1m = listings.filter(l => l.price >= 750000 && l.price < 1000000).length;
    const over1m = listings.filter(l => l.price >= 1000000).length;

    const stats: CommunityStats = {
      activeListings: total,
      medianPrice,
      avgPrice,
      pricePerSqft,
      avgDaysOnMarket,
      minPrice: prices[0],
      maxPrice: prices[prices.length - 1],
      singleFamilyCount,
      condoCount,
      townhouseCount,
      avgBedrooms,
      avgBathrooms,
      avgSqft,
      under500k,
      range500kTo750k,
      range750kTo1m,
      over1m,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Community stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community stats' },
      { status: 500 }
    );
  }
}

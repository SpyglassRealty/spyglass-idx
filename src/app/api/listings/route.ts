import { NextRequest, NextResponse } from 'next/server';
import { SearchFilters } from '@/types/listing';
import { searchListings } from '@/lib/repliers-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const zip = searchParams.get('zip') || undefined;
    const city = searchParams.get('city') || undefined;
    const polygonStr = searchParams.get('polygon');
    
    // Parse polygon from query string (format: "lat,lng;lat,lng;...")
    // Convert to bounding box since Repliers doesn't support polygon search directly
    let bounds: { north: number; south: number; east: number; west: number } | undefined;
    if (polygonStr) {
      const points = polygonStr.split(';').map(pair => {
        const [lat, lng] = pair.split(',').map(Number);
        return { lat, lng };
      }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));
      
      if (points.length >= 3) {
        // Calculate bounding box from polygon points
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        bounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs),
        };
      }
    }
    
    const filters: SearchFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '24'),
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minBeds: searchParams.get('minBeds') ? parseInt(searchParams.get('minBeds')!) : undefined,
      minBaths: searchParams.get('minBaths') ? parseInt(searchParams.get('minBaths')!) : undefined,
      city,
      zip,
      bounds,
      // Only default to Travis if no location filter provided
      area: searchParams.get('area') || (zip || city || bounds ? undefined : 'Travis'),
      sort: (searchParams.get('sort') as SearchFilters['sort']) || 'date-desc',
    };

    const results = await searchListings(filters);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const filters: SearchFilters = await request.json();
    
    // Default to Austin area if no location specified
    if (!filters.area && !filters.city && !filters.zip && !filters.bounds && !filters.polygon) {
      filters.area = 'Travis';
    }
    
    const results = await searchListings(filters);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: String(error) },
      { status: 500 }
    );
  }
}

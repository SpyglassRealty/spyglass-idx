import { NextRequest, NextResponse } from 'next/server';

const REPLIERS_API_URL = process.env.REPLIERS_API_URL || 'https://api.repliers.io';
const REPLIERS_API_KEY = process.env.REPLIERS_API_KEY || '';

interface NLPRequest {
  prompt: string;
  nlpId?: string;
}

interface NLPResponse {
  request: {
    url: string;
    body: any | null;
    summary: string;
  };
  nlpId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, nlpId }: NLPRequest = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call Repliers NLP endpoint
    const nlpPayload: NLPRequest = { prompt };
    if (nlpId) {
      nlpPayload.nlpId = nlpId;
    }

    const response = await fetch(`${REPLIERS_API_URL}/nlp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'REPLIERS-API-KEY': REPLIERS_API_KEY,
      },
      body: JSON.stringify(nlpPayload),
    });

    if (response.status === 406) {
      // Prompt was not related to real estate search
      return NextResponse.json({
        error: 'not_real_estate',
        message: 'Please ask about real estate listings. For example: "Find me a 3 bedroom house in Austin under $500k"',
      }, { status: 406 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Repliers NLP error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process search', details: errorText },
        { status: response.status }
      );
    }

    const nlpResult: NLPResponse = await response.json();

    // Extract the generated URL and parse its params
    const generatedUrl = new URL(nlpResult.request.url);
    const searchParams = Object.fromEntries(generatedUrl.searchParams.entries());

    // Now fetch the actual listings using the generated params
    const listingsResponse = await fetch(`${REPLIERS_API_URL}/listings?${generatedUrl.searchParams.toString()}`, {
      headers: {
        'REPLIERS-API-KEY': REPLIERS_API_KEY,
      },
    });

    if (!listingsResponse.ok) {
      throw new Error('Failed to fetch listings');
    }

    const listingsData = await listingsResponse.json();

    // Transform listings to our format (reuse logic from listings route)
    const transformedListings = listingsData.listings?.map((raw: any) => ({
      id: raw.mlsNumber,
      mlsNumber: raw.mlsNumber,
      address: {
        street: `${raw.address.streetNumber} ${raw.address.streetName} ${raw.address.streetSuffix || ''}`.trim(),
        city: raw.address.city,
        state: raw.address.state,
        zip: raw.address.zip,
        full: `${raw.address.streetNumber} ${raw.address.streetName} ${raw.address.streetSuffix || ''}, ${raw.address.city}, ${raw.address.state} ${raw.address.zip}`.trim(),
        neighborhood: raw.address.neighborhood || undefined,
      },
      price: raw.listPrice,
      bedrooms: raw.details.numBedrooms || 0,
      bathrooms: raw.details.numBathrooms || 0,
      sqft: typeof raw.details.sqft === 'string' ? parseInt(raw.details.sqft, 10) || 0 : raw.details.sqft || 0,
      propertyType: raw.details.propertyType || 'Single Family',
      status: raw.status === 'A' ? 'Active' : raw.status,
      daysOnMarket: raw.daysOnMarket || 0,
      photos: raw.images?.map((img: string) => `https://cdn.repliers.io/${img}`) || [],
      coordinates: {
        lat: raw.map?.latitude,
        lng: raw.map?.longitude,
      },
      listDate: raw.listDate,
      updatedAt: raw.lastUpdate || raw.listDate,
    })) || [];

    return NextResponse.json({
      // NLP metadata
      nlpId: nlpResult.nlpId,
      summary: nlpResult.request.summary,
      searchParams,
      
      // Listings
      listings: transformedListings,
      total: listingsData.count || transformedListings.length,
      
      // Image search body if present
      imageSearch: nlpResult.request.body?.imageSearchItems || null,
    });

  } catch (error) {
    console.error('NLP Search error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI search', details: String(error) },
      { status: 500 }
    );
  }
}

'use client';

import { formatPrice, formatNumber } from '@/lib/utils';

interface CommunityDescriptionProps {
  name: string;
  county: string;
  stats?: {
    activeListings: number;
    medianPrice: number;
    avgPrice: number;
    pricePerSqft: number;
    avgDaysOnMarket: number;
    avgSqft: number;
    avgBedrooms: number;
  } | null;
}

export default function CommunityDescription({ name, county, stats }: CommunityDescriptionProps) {
  // Generate dynamic description based on available data
  const generateDescription = () => {
    const parts: string[] = [];

    // Intro
    parts.push(
      `${name} is a sought-after neighborhood in ${county} County, located in the greater Austin, Texas metropolitan area.`
    );

    if (stats && stats.activeListings > 0) {
      // Market overview
      parts.push(
        `The ${name} real estate market currently has ${stats.activeListings} active listings with a median home price of ${formatPrice(stats.medianPrice)}.`
      );

      // Price context
      if (stats.medianPrice < 400000) {
        parts.push(
          `This makes ${name} one of the more affordable neighborhoods in the Austin area, offering great value for homebuyers.`
        );
      } else if (stats.medianPrice < 600000) {
        parts.push(
          `${name} offers moderately priced homes compared to the broader Austin market, attracting a mix of first-time buyers and growing families.`
        );
      } else if (stats.medianPrice < 1000000) {
        parts.push(
          `As an established neighborhood, ${name} features homes that reflect the area's desirability and strong market fundamentals.`
        );
      } else {
        parts.push(
          `${name} is one of Austin's premier neighborhoods, featuring luxury homes and an exceptional quality of life.`
        );
      }

      // Property characteristics
      if (stats.avgSqft > 0) {
        parts.push(
          `Homes in ${name} average ${formatNumber(stats.avgSqft)} square feet with ${stats.avgBedrooms} bedrooms, priced at approximately $${stats.pricePerSqft} per square foot.`
        );
      }

      // Market activity
      if (stats.avgDaysOnMarket < 20) {
        parts.push(
          `Properties in ${name} are selling quickly, averaging just ${stats.avgDaysOnMarket} days on market — a sign of strong buyer demand.`
        );
      } else if (stats.avgDaysOnMarket < 45) {
        parts.push(
          `The market in ${name} is active, with homes typically selling within ${stats.avgDaysOnMarket} days.`
        );
      } else {
        parts.push(
          `Buyers have time to carefully consider their options, with homes averaging ${stats.avgDaysOnMarket} days on market.`
        );
      }
    }

    // Closing CTA
    parts.push(
      `Whether you're looking to buy or sell in ${name}, our team at Spyglass Realty can help you navigate this competitive market. Contact us today for a personalized consultation.`
    );

    return parts.join(' ');
  };

  return (
    <div className="prose prose-gray max-w-none">
      <h2 className="text-xl font-bold text-gray-900 mb-4">About {name}</h2>
      <p className="text-gray-600 leading-relaxed">
        {generateDescription()}
      </p>
      
      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: name,
            description: `${name} is a neighborhood in ${county} County, Austin, Texas.`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Austin',
              addressRegion: 'TX',
              addressCountry: 'US'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 30.2672,
              longitude: -97.7431
            },
            ...(stats && stats.medianPrice > 0 ? {
              additionalProperty: [
                {
                  '@type': 'PropertyValue',
                  name: 'Median Home Price',
                  value: stats.medianPrice
                },
                {
                  '@type': 'PropertyValue',
                  name: 'Active Listings',
                  value: stats.activeListings
                }
              ]
            } : {})
          })
        }}
      />
    </div>
  );
}

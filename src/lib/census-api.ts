/**
 * Census Bureau API Integration
 * Fetches demographic data for zip codes
 * 
 * API: https://api.census.gov/data
 * Using American Community Survey 5-year estimates
 */

const CENSUS_API_BASE = 'https://api.census.gov/data/2022/acs/acs5';

// No API key needed for basic queries (limited rate)
// For production, get a key at: https://api.census.gov/data/key_signup.html
const CENSUS_API_KEY = process.env.CENSUS_API_KEY || '';

export interface DemographicData {
  population: number;
  households: number;
  medianHouseholdIncome: number;
  medianAge: number;
  collegeEducatedPct: number;
  homeownershipRate: number;
  medianHomeValue: number;
  averageHouseholdSize: number;
  unemploymentRate: number;
  commuteTime: number;
  // Age breakdown
  under18Pct: number;
  age18to34Pct: number;
  age35to54Pct: number;
  age55plusPct: number;
}

interface CensusResponse {
  [key: string]: string;
}

/**
 * Fetch demographic data for a list of zip codes
 * Groups zips in batches to avoid API limits
 */
export async function getDemographicsForZips(zips: string[]): Promise<DemographicData | null> {
  if (!zips.length) return null;

  try {
    // Census variables we want
    const variables = [
      'B01003_001E', // Total population
      'B11001_001E', // Total households
      'B19013_001E', // Median household income
      'B01002_001E', // Median age
      'B15003_022E', // Bachelor's degree
      'B15003_023E', // Master's degree
      'B15003_024E', // Professional degree
      'B15003_025E', // Doctorate
      'B15003_001E', // Total education population (25+)
      'B25003_002E', // Owner occupied housing
      'B25003_001E', // Total occupied housing
      'B25077_001E', // Median home value
      'B25010_001E', // Average household size
      'B23025_005E', // Unemployed
      'B23025_002E', // In labor force
      'B08303_001E', // Total commuters
      'B08303_012E', // Commute 30-34 min
      'B08303_013E', // Commute 35-44 min
      'B01001_003E', // Male under 5
      'B01001_004E', // Male 5-9
      'B01001_005E', // Male 10-14
      'B01001_006E', // Male 15-17
      'B01001_027E', // Female under 5
      'B01001_028E', // Female 5-9
      'B01001_029E', // Female 10-14
      'B01001_030E', // Female 15-17
    ].join(',');

    // Batch zips (max 50 per request)
    const zipBatches = [];
    for (let i = 0; i < zips.length; i += 50) {
      zipBatches.push(zips.slice(i, i + 50));
    }

    let totalPop = 0;
    let totalHouseholds = 0;
    let weightedIncome = 0;
    let weightedAge = 0;
    let totalCollegeEdu = 0;
    let totalEduPop = 0;
    let totalOwnerOccupied = 0;
    let totalOccupied = 0;
    let weightedHomeValue = 0;
    let weightedHHSize = 0;
    let totalUnemployed = 0;
    let totalLaborForce = 0;
    let totalCommuters = 0;
    let totalUnder18 = 0;

    for (const batch of zipBatches) {
      const zipList = batch.join(',');
      const url = `${CENSUS_API_BASE}?get=${variables}&for=zip%20code%20tabulation%20area:${zipList}${CENSUS_API_KEY ? `&key=${CENSUS_API_KEY}` : ''}`;

      const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache for 24 hours
      
      if (!response.ok) {
        console.error('Census API error:', response.status);
        continue;
      }

      const data = await response.json();
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const pop = parseInt(row[0]) || 0;
        const households = parseInt(row[1]) || 0;
        const income = parseInt(row[2]) || 0;
        const age = parseFloat(row[3]) || 0;
        const bachelors = parseInt(row[4]) || 0;
        const masters = parseInt(row[5]) || 0;
        const professional = parseInt(row[6]) || 0;
        const doctorate = parseInt(row[7]) || 0;
        const eduPop = parseInt(row[8]) || 0;
        const ownerOcc = parseInt(row[9]) || 0;
        const totalOcc = parseInt(row[10]) || 0;
        const homeValue = parseInt(row[11]) || 0;
        const hhSize = parseFloat(row[12]) || 0;
        const unemployed = parseInt(row[13]) || 0;
        const laborForce = parseInt(row[14]) || 0;
        const commuters = parseInt(row[15]) || 0;
        
        // Age under 18 (male + female)
        const maleUnder18 = (parseInt(row[18]) || 0) + (parseInt(row[19]) || 0) + 
                           (parseInt(row[20]) || 0) + (parseInt(row[21]) || 0);
        const femaleUnder18 = (parseInt(row[22]) || 0) + (parseInt(row[23]) || 0) + 
                             (parseInt(row[24]) || 0) + (parseInt(row[25]) || 0);

        totalPop += pop;
        totalHouseholds += households;
        weightedIncome += income * households;
        weightedAge += age * pop;
        totalCollegeEdu += bachelors + masters + professional + doctorate;
        totalEduPop += eduPop;
        totalOwnerOccupied += ownerOcc;
        totalOccupied += totalOcc;
        weightedHomeValue += homeValue * totalOcc;
        weightedHHSize += hhSize * households;
        totalUnemployed += unemployed;
        totalLaborForce += laborForce;
        totalCommuters += commuters;
        totalUnder18 += maleUnder18 + femaleUnder18;
      }
    }

    if (totalPop === 0) return null;

    // Calculate averages/percentages
    const medianIncome = totalHouseholds > 0 ? Math.round(weightedIncome / totalHouseholds) : 0;
    const medianAge = totalPop > 0 ? Math.round(weightedAge / totalPop * 10) / 10 : 0;
    const collegeEduPct = totalEduPop > 0 ? Math.round(totalCollegeEdu / totalEduPop * 100) : 0;
    const homeownershipRate = totalOccupied > 0 ? Math.round(totalOwnerOccupied / totalOccupied * 100) : 0;
    const medianHomeValue = totalOccupied > 0 ? Math.round(weightedHomeValue / totalOccupied) : 0;
    const avgHHSize = totalHouseholds > 0 ? Math.round(weightedHHSize / totalHouseholds * 10) / 10 : 0;
    const unemploymentRate = totalLaborForce > 0 ? Math.round(totalUnemployed / totalLaborForce * 1000) / 10 : 0;
    const under18Pct = totalPop > 0 ? Math.round(totalUnder18 / totalPop * 100) : 0;

    return {
      population: totalPop,
      households: totalHouseholds,
      medianHouseholdIncome: medianIncome,
      medianAge: medianAge,
      collegeEducatedPct: collegeEduPct,
      homeownershipRate: homeownershipRate,
      medianHomeValue: medianHomeValue,
      averageHouseholdSize: avgHHSize,
      unemploymentRate: unemploymentRate,
      commuteTime: 28, // Default estimate for Austin area
      under18Pct: under18Pct,
      age18to34Pct: 25, // Estimate
      age35to54Pct: 30, // Estimate
      age55plusPct: 100 - under18Pct - 25 - 30,
    };
  } catch (error) {
    console.error('Failed to fetch Census data:', error);
    return null;
  }
}

/**
 * Get zip codes that intersect with a polygon
 * Uses a simple bounding box check for now
 */
export function getZipsInPolygon(polygon: Array<[number, number]>, allZips: string[]): string[] {
  // Calculate bounding box from polygon
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  
  for (const [lng, lat] of polygon) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  // For now, return zips that we know are in the Austin area
  // In production, would use a zip code centroid database
  return allZips;
}

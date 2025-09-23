// US and Canada destination data for Swift Travel
// Limited to major cities and tourist destinations in North America

export interface Destination {
  city: string;
  state?: string;
  province?: string;
  country: 'USA' | 'Canada';
  displayName: string;
  searchTerms: string[];
}

export const NORTH_AMERICA_DESTINATIONS: Destination[] = [
  // United States - Major Cities
  { city: 'New York City', state: 'NY', country: 'USA', displayName: 'New York City, NY', searchTerms: ['nyc', 'new york', 'manhattan', 'big apple'] },
  { city: 'Los Angeles', state: 'CA', country: 'USA', displayName: 'Los Angeles, CA', searchTerms: ['la', 'los angeles', 'hollywood'] },
  { city: 'Chicago', state: 'IL', country: 'USA', displayName: 'Chicago, IL', searchTerms: ['chicago', 'windy city'] },
  { city: 'Houston', state: 'TX', country: 'USA', displayName: 'Houston, TX', searchTerms: ['houston'] },
  { city: 'Phoenix', state: 'AZ', country: 'USA', displayName: 'Phoenix, AZ', searchTerms: ['phoenix'] },
  { city: 'Philadelphia', state: 'PA', country: 'USA', displayName: 'Philadelphia, PA', searchTerms: ['philadelphia', 'philly'] },
  { city: 'San Antonio', state: 'TX', country: 'USA', displayName: 'San Antonio, TX', searchTerms: ['san antonio'] },
  { city: 'San Diego', state: 'CA', country: 'USA', displayName: 'San Diego, CA', searchTerms: ['san diego'] },
  { city: 'Dallas', state: 'TX', country: 'USA', displayName: 'Dallas, TX', searchTerms: ['dallas'] },
  { city: 'San Francisco', state: 'CA', country: 'USA', displayName: 'San Francisco, CA', searchTerms: ['san francisco', 'sf', 'bay area'] },
  { city: 'Austin', state: 'TX', country: 'USA', displayName: 'Austin, TX', searchTerms: ['austin'] },
  { city: 'Seattle', state: 'WA', country: 'USA', displayName: 'Seattle, WA', searchTerms: ['seattle'] },
  { city: 'Denver', state: 'CO', country: 'USA', displayName: 'Denver, CO', searchTerms: ['denver', 'mile high city'] },
  { city: 'Washington', state: 'DC', country: 'USA', displayName: 'Washington, DC', searchTerms: ['washington dc', 'dc', 'district of columbia'] },
  { city: 'Boston', state: 'MA', country: 'USA', displayName: 'Boston, MA', searchTerms: ['boston'] },
  { city: 'Nashville', state: 'TN', country: 'USA', displayName: 'Nashville, TN', searchTerms: ['nashville', 'music city'] },
  { city: 'Miami', state: 'FL', country: 'USA', displayName: 'Miami, FL', searchTerms: ['miami'] },
  { city: 'Portland', state: 'OR', country: 'USA', displayName: 'Portland, OR', searchTerms: ['portland'] },
  { city: 'Las Vegas', state: 'NV', country: 'USA', displayName: 'Las Vegas, NV', searchTerms: ['las vegas', 'vegas'] },
  { city: 'New Orleans', state: 'LA', country: 'USA', displayName: 'New Orleans, LA', searchTerms: ['new orleans', 'nola', 'big easy'] },
  { city: 'Orlando', state: 'FL', country: 'USA', displayName: 'Orlando, FL', searchTerms: ['orlando'] },
  { city: 'Atlanta', state: 'GA', country: 'USA', displayName: 'Atlanta, GA', searchTerms: ['atlanta'] },
  { city: 'Salt Lake City', state: 'UT', country: 'USA', displayName: 'Salt Lake City, UT', searchTerms: ['salt lake city', 'slc'] },
  { city: 'San Jose', state: 'CA', country: 'USA', displayName: 'San Jose, CA', searchTerms: ['san jose'] },
  { city: 'Minneapolis', state: 'MN', country: 'USA', displayName: 'Minneapolis, MN', searchTerms: ['minneapolis', 'twin cities'] },
  { city: 'Tampa', state: 'FL', country: 'USA', displayName: 'Tampa, FL', searchTerms: ['tampa'] },
  { city: 'Honolulu', state: 'HI', country: 'USA', displayName: 'Honolulu, HI', searchTerms: ['honolulu', 'hawaii'] },
  { city: 'Charleston', state: 'SC', country: 'USA', displayName: 'Charleston, SC', searchTerms: ['charleston'] },
  { city: 'Savannah', state: 'GA', country: 'USA', displayName: 'Savannah, GA', searchTerms: ['savannah'] },
  { city: 'Anchorage', state: 'AK', country: 'USA', displayName: 'Anchorage, AK', searchTerms: ['anchorage', 'alaska'] },
  
  // Canada - Major Cities
  { city: 'Toronto', province: 'ON', country: 'Canada', displayName: 'Toronto, ON', searchTerms: ['toronto'] },
  { city: 'Montreal', province: 'QC', country: 'Canada', displayName: 'Montreal, QC', searchTerms: ['montreal'] },
  { city: 'Vancouver', province: 'BC', country: 'Canada', displayName: 'Vancouver, BC', searchTerms: ['vancouver'] },
  { city: 'Calgary', province: 'AB', country: 'Canada', displayName: 'Calgary, AB', searchTerms: ['calgary'] },
  { city: 'Edmonton', province: 'AB', country: 'Canada', displayName: 'Edmonton, AB', searchTerms: ['edmonton'] },
  { city: 'Ottawa', province: 'ON', country: 'Canada', displayName: 'Ottawa, ON', searchTerms: ['ottawa'] },
  { city: 'Quebec City', province: 'QC', country: 'Canada', displayName: 'Quebec City, QC', searchTerms: ['quebec city', 'quebec'] },
  { city: 'Winnipeg', province: 'MB', country: 'Canada', displayName: 'Winnipeg, MB', searchTerms: ['winnipeg'] },
  { city: 'Halifax', province: 'NS', country: 'Canada', displayName: 'Halifax, NS', searchTerms: ['halifax'] },
  { city: 'Victoria', province: 'BC', country: 'Canada', displayName: 'Victoria, BC', searchTerms: ['victoria'] },
  { city: 'Banff', province: 'AB', country: 'Canada', displayName: 'Banff, AB', searchTerms: ['banff'] },
  { city: 'Niagara Falls', province: 'ON', country: 'Canada', displayName: 'Niagara Falls, ON', searchTerms: ['niagara falls', 'niagara'] },
];

// Popular destinations for quick selection
export const POPULAR_DESTINATIONS = [
  'New York City, NY',
  'San Francisco, CA', 
  'Miami, FL',
  'Las Vegas, NV',
  'Toronto, ON',
  'Vancouver, BC',
  'New Orleans, LA',
  'Chicago, IL'
];

// Validation function
export function isValidNorthAmericanDestination(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();
  
  return NORTH_AMERICA_DESTINATIONS.some(dest => {
    // Check exact city match
    if (dest.city.toLowerCase() === normalizedInput) return true;
    
    // Check display name match
    if (dest.displayName.toLowerCase() === normalizedInput) return true;
    
    // Check search terms
    return dest.searchTerms.some(term => term === normalizedInput);
  });
}

// Get destination suggestions based on input
export function getDestinationSuggestions(input: string): Destination[] {
  if (!input || input.length < 2) return [];
  
  const normalizedInput = input.toLowerCase().trim();
  
  return NORTH_AMERICA_DESTINATIONS.filter(dest => {
    // Check if city starts with input
    if (dest.city.toLowerCase().startsWith(normalizedInput)) return true;
    
    // Check if any search term matches
    return dest.searchTerms.some(term => term.includes(normalizedInput));
  }).slice(0, 8); // Return max 8 suggestions
}
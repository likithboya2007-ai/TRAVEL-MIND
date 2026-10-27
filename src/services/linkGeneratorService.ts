/**
 * Link Generator Service
 * Generates real, functional links for restaurants, hotels, attractions, and activities
 * Uses Google Maps, official websites, and booking platforms
 */

export interface PlaceLink {
  type: 'website' | 'maps' | 'directions' | 'booking' | 'menu';
  label: string;
  url: string;
  icon: 'globe' | 'map' | 'directions' | 'bed' | 'utensils';
}

/**
 * Generate Google Maps search URL
 */
export function generateGoogleMapsSearch(placeName: string, destination: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    // Use coordinates for precise location with query parameter
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  
  // Use name + destination for search
  const query = `${placeName}, ${destination}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Generate Google Maps directions URL
 */
export function generateGoogleMapsDirections(placeName: string, destination: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  
  const query = `${placeName}, ${destination}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/**
 * Generate restaurant links (Map + Directions)
 */
export function generateRestaurantLinks(
  restaurantName: string,
  destination: string,
  lat?: number,
  lng?: number
): PlaceLink[] {
  return [
    {
      type: 'maps',
      label: 'View on Google Maps',
      url: generateGoogleMapsSearch(restaurantName, destination, lat, lng),
      icon: 'map',
    },
    {
      type: 'directions',
      label: 'Get Directions',
      url: generateGoogleMapsDirections(restaurantName, destination, lat, lng),
      icon: 'directions',
    },
  ];
}

/**
 * Generate hotel links (Maps + Booking search)
 */
export function generateHotelLinks(
  hotelName: string,
  destination: string,
  lat?: number,
  lng?: number
): PlaceLink[] {
  const links: PlaceLink[] = [
    {
      type: 'maps',
      label: 'View on Google Maps',
      url: generateGoogleMapsSearch(hotelName, destination, lat, lng),
      icon: 'map',
    },
  ];

  // Add Booking.com search link (destination-based, not specific property)
  const bookingSearchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`;
  links.push({
    type: 'booking',
    label: 'Find Hotels',
    url: bookingSearchUrl,
    icon: 'bed',
  });

  return links;
}

/**
 * Generate multiple hotel booking platform links
 */
export function generateHotelBookingPlatforms(destination: string, checkIn?: string, checkOut?: string): {
  primary: { name: string; url: string };
  alternatives: Array<{ name: string; url: string }>;
} {
  const destEncoded = encodeURIComponent(destination);
  
  // Format dates for URL (YYYY-MM-DD)
  const checkinParam = checkIn ? `&checkin=${checkIn}` : '';
  const checkoutParam = checkOut ? `&checkout=${checkOut}` : '';
  
  return {
    primary: {
      name: 'Booking.com',
      url: `https://www.booking.com/searchresults.html?ss=${destEncoded}${checkinParam}${checkoutParam}`,
    },
    alternatives: [
      {
        name: 'MakeMyTrip',
        url: `https://www.makemytrip.com/hotels/hotel-listing/?city=${destEncoded}`,
      },
      {
        name: 'Agoda',
        url: `https://www.agoda.com/search?city=${destEncoded}`,
      },
      {
        name: 'Goibibo',
        url: `https://www.goibibo.com/hotels/hotels-in-${destEncoded}/`,
      },
      {
        name: 'Airbnb',
        url: `https://www.airbnb.com/s/${destEncoded}/homes`,
      },
      {
        name: 'OYO',
        url: `https://www.oyorooms.com/search/?location=${destEncoded}`,
      },
    ],
  };
}

/**
 * Generate multiple restaurant booking/search platform links
 */
export function generateRestaurantBookingPlatforms(destination: string, restaurantName?: string): {
  primary: { name: string; url: string };
  alternatives: Array<{ name: string; url: string }>;
} {
  const destEncoded = encodeURIComponent(destination);
  const restaurantEncoded = restaurantName ? encodeURIComponent(restaurantName) : '';
  
  // Search query: "restaurant name destination" or just destination
  const searchQuery = restaurantName 
    ? encodeURIComponent(`${restaurantName} ${destination}`)
    : destEncoded;
  
  return {
    primary: {
      name: 'Zomato',
      url: restaurantName
        ? `https://www.zomato.com/search?q=${searchQuery}`
        : `https://www.zomato.com/${destEncoded}/restaurants`,
    },
    alternatives: [
      {
        name: 'Swiggy Dineout',
        url: `https://www.swiggy.com/dineout-restaurants`,
      },
      {
        name: 'EazyDiner',
        url: `https://www.eazydiner.com/search?q=${searchQuery}`,
      },
      {
        name: 'Google Maps',
        url: `https://www.google.com/maps/search/restaurants+in+${destEncoded}`,
      },
      {
        name: 'TripAdvisor',
        url: `https://www.tripadvisor.com/Search?q=restaurants+${searchQuery}`,
      },
    ],
  };
}

/**
 * Generate attraction/activity links (Maps + Directions)
 */
export function generateAttractionLinks(
  attractionName: string,
  destination: string,
  lat?: number,
  lng?: number
): PlaceLink[] {
  return [
    {
      type: 'maps',
      label: 'View on Google Maps',
      url: generateGoogleMapsSearch(attractionName, destination, lat, lng),
      icon: 'map',
    },
    {
      type: 'directions',
      label: 'Get Directions',
      url: generateGoogleMapsDirections(attractionName, destination, lat, lng),
      icon: 'directions',
    },
  ];
}

/**
 * Generate MakeMyTrip hotel search URL for a destination
 */
export function generateMakeMyTripHotelSearch(destination: string): string {
  const query = encodeURIComponent(destination);
  return `https://www.makemytrip.com/hotels/hotel-listing/?city=${query}`;
}

/**
 * Generate Zomato restaurant search URL
 */
export function generateZomatoSearch(destination: string): string {
  const query = encodeURIComponent(destination);
  return `https://www.zomato.com/${query}/restaurants`;
}

/**
 * Check if a place name likely has an official website
 * (This is a heuristic - not guaranteed)
 */
export function mightHaveOfficialWebsite(placeName: string): boolean {
  const indicators = ['hotel', 'resort', 'palace', 'fort', 'museum', 'taj', 'oberoi', 'hyatt', 'marriott'];
  const lowerName = placeName.toLowerCase();
  return indicators.some(indicator => lowerName.includes(indicator));
}

/**
 * Safe link opener - opens in new tab with security
 */
export function openExternalLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

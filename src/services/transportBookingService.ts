/**
 * Transportation Booking Service
 * Generates real booking links for Bus, Train, Flight, and Car rentals
 */

export type TransportMode = 'bus' | 'train' | 'flight' | 'car';

interface TransportBookingParams {
  from: string;
  to: string;
  date: string;
  mode: TransportMode;
  returnDate?: string;
}

/**
 * Generate booking URL for bus tickets
 */
export function generateBusBookingUrl(from: string, to: string, date: string): string {
  const formattedDate = date; // YYYY-MM-DD format
  
  // RedBus - Most popular bus booking platform in India
  const fromEncoded = encodeURIComponent(from);
  const toEncoded = encodeURIComponent(to);
  
  return `https://www.redbus.in/bus-tickets/${fromEncoded}-to-${toEncoded}?fromCityName=${fromEncoded}&toCityName=${toEncoded}&onward=${formattedDate}`;
}

/**
 * Generate booking URL for train tickets
 */
export function generateTrainBookingUrl(from: string, to: string, date: string): string {
  // IRCTC - Official Indian Railways booking
  // Note: IRCTC requires login, so we'll use MakeMyTrip as fallback
  const fromEncoded = encodeURIComponent(from);
  const toEncoded = encodeURIComponent(to);
  const formattedDate = formatDateForUrl(date);
  
  return `https://www.makemytrip.com/railways/train-tickets/?from=${fromEncoded}&to=${toEncoded}&date=${formattedDate}`;
}

/**
 * Generate booking URL for flight tickets
 */
export function generateFlightBookingUrl(
  from: string,
  to: string,
  departureDate: string,
  returnDate?: string
): string {
  const fromEncoded = encodeURIComponent(from);
  const toEncoded = encodeURIComponent(to);
  const depDate = formatDateForUrl(departureDate);
  
  if (returnDate) {
    const retDate = formatDateForUrl(returnDate);
    // Round-trip flight
    return `https://www.makemytrip.com/flight/search?itinerary=${fromEncoded}-${toEncoded}-${depDate}_${toEncoded}-${fromEncoded}-${retDate}&tripType=R&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`;
  } else {
    // One-way flight
    return `https://www.makemytrip.com/flight/search?itinerary=${fromEncoded}-${toEncoded}-${depDate}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`;
  }
}

/**
 * Generate booking URL for car rentals
 */
export function generateCarRentalUrl(location: string, startDate: string, endDate: string): string {
  const locationEncoded = encodeURIComponent(location);
  const start = formatDateForUrl(startDate);
  const end = formatDateForUrl(endDate);
  
  // Zoomcar - Popular self-drive car rental in India
  return `https://www.zoomcar.com/car-rental/${locationEncoded}?start_date=${start}&end_date=${end}`;
}

/**
 * Generate alternative car rental URL (Ola/Uber)
 */
export function generateRideHailingUrl(location: string): string {
  // Opens Uber app/website for the destination
  const locationEncoded = encodeURIComponent(location);
  return `https://www.uber.com/global/en/cities/${locationEncoded}/`;
}

/**
 * Generate comprehensive transport booking options
 */
export function generateTransportBooking(params: TransportBookingParams): {
  primary: string;
  alternatives: Array<{ name: string; url: string }>;
} {
  const { from, to, date, mode, returnDate } = params;

  switch (mode) {
    case 'bus':
      return {
        primary: generateBusBookingUrl(from, to, date),
        alternatives: [
          { name: 'AbhiBus', url: `https://www.abhibus.com/bus-ticket-booking/` },
          { name: 'Goibibo Buses', url: `https://www.goibibo.com/bus/` },
        ],
      };

    case 'train':
      return {
        primary: generateTrainBookingUrl(from, to, date),
        alternatives: [
          { name: 'IRCTC (Official)', url: `https://www.irctc.co.in/nget/train-search` },
          { name: 'RailYatri', url: `https://www.railyatri.in/train-ticket-booking` },
          { name: 'Goibibo Trains', url: `https://www.goibibo.com/trains/` },
        ],
      };

    case 'flight':
      return {
        primary: generateFlightBookingUrl(from, to, date, returnDate),
        alternatives: [
          { name: 'Google Flights', url: `https://www.google.com/flights` },
          { name: 'Skyscanner', url: `https://www.skyscanner.co.in/` },
          { name: 'Cleartrip', url: `https://www.cleartrip.com/flights` },
          { name: 'Goibibo Flights', url: `https://www.goibibo.com/flights/` },
        ],
      };

    case 'car':
      return {
        primary: generateCarRentalUrl(to, date, returnDate || date),
        alternatives: [
          { name: 'Revv', url: `https://www.revv.co.in/` },
          { name: 'Uber', url: generateRideHailingUrl(to) },
          { name: 'Ola', url: `https://www.olacabs.com/` },
          { name: 'Savaari', url: `https://www.savaari.com/` },
        ],
      };

    default:
      return {
        primary: `https://www.makemytrip.com/`,
        alternatives: [],
      };
  }
}

/**
 * Format date from YYYY-MM-DD to DDMMYYYY for booking URLs
 */
function formatDateForUrl(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Get transport mode display name
 */
export function getTransportModeDisplayName(mode: TransportMode): string {
  const names: Record<TransportMode, string> = {
    bus: 'Bus',
    train: 'Train',
    flight: 'Flight',
    car: 'Car Rental',
  };
  return names[mode] || 'Transport';
}

/**
 * Get transport mode icon emoji
 */
export function getTransportModeIcon(mode: TransportMode): string {
  const icons: Record<TransportMode, string> = {
    bus: '🚌',
    train: '🚆',
    flight: '✈️',
    car: '🚗',
  };
  return icons[mode] || '🚗';
}

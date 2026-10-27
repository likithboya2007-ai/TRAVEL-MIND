export interface GeocodedPlace {
  id: string;
  name: string;
  displayName: string;
  city?: string;
  state?: string;
  country: string;
  countryCode?: string;
  osmType?: string;
  osmValue?: string;
  lat: number;
  lng: number;
  formattedType: string;
}

export interface PhotoAttribution {
  artist?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl: string;
  title: string;
  description?: string;
}

export interface PlacePhoto {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  title: string;
  attribution: PhotoAttribution;
  isMainCandidate?: boolean;
}

export interface GlobalDestinationDetails {
  place: GeocodedPlace;
  description?: string;
  wikipediaUrl?: string;
  photos: PlacePhoto[];
  selectedPhoto: PlacePhoto | null;
  isLoadingPhotos: boolean;
  photoError?: string | null;
}

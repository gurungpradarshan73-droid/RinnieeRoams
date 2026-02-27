export interface Place {
  name: string;
  description: string;
  location: string;
  rating?: number;
  priceLevel?: string;
  type: string;
  imageUrl?: string;
}

export interface ItineraryDay {
  day: number;
  activities: {
    time: string;
    activity: string;
    location: string;
    description: string;
  }[];
}

export interface TravelInfo {
  flights?: {
    from: string;
    to: string;
    price: string;
    duration: string;
    airline: string;
  }[];
  hotels?: {
    name: string;
    price: string;
    rating: string;
    amenities: string[];
  }[];
  cabs?: {
    type: string;
    estimatedFare: string;
    provider: string;
  }[];
}

export interface CountryGuide {
  name: string;
  overview: string;
  culture: string;
  mustVisit: Place[];
  transportation: string;
  bestTimeToVisit: string;
}

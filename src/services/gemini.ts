import { GoogleGenAI } from "@google/genai";
import { CountryGuide, TravelInfo, ItineraryDay } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getCountryGuide(country: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a vibrant and comprehensive travel guide for ${country}. Focus heavily on:
    1. The Travel Vibe & Spirit (What it's like to roam here)
    2. Top 5 Must-Visit Places. For EACH place, include:
       - A high-quality image using this format: ![Place Name](https://loremflickr.com/800/500/PlaceName,landmark,vacation/all)
       - A "Why Visit" section explaining what makes it special and fun.
    3. Essential Travel Tips (Transport, safety, local secrets)
    4. Must-Do Activities & Experiences (Hiking, nightlife, shopping, etc.)
    5. Food & Drink (The best local spots to eat like a local)
    
    Format the response in Markdown with an engaging, adventurous storytelling tone. Ensure images are placed right before or after the description of each place.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text || "Sorry, I couldn't find information for that country.";
}

export async function getRealTimeTravelInfo(from: string, to: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find real-time travel information from ${from} to ${to}. 
    Include estimated flight prices, popular hotels in ${to} with current price ranges, and typical cab fares (Uber/local) within ${to}.
    Use current data if possible.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text || "Could not retrieve real-time travel info.";
}

export async function planItinerary(destination: string, days: number, interests: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a detailed ${days}-day travel itinerary for ${destination} focusing on ${interests}. 
    For each day, provide a morning, afternoon, and evening activity with locations and brief descriptions.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text || "Could not generate an itinerary.";
}

export async function searchPlacesNearby(query: string, lat?: number, lng?: number): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find ${query} nearby.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: lat && lng ? {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      } : undefined
    },
  });

  return response.text || "No places found.";
}

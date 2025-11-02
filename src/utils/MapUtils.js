// src/utils/MapUtils.js
import axios from "axios";
import { fromLonLat } from "ol/proj";

export const reverseGeocode = async (lon, lat) => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat: lat,
          lon: lon,
          format: "json",
          "accept-language": "en",
          zoom: 18,
        },
      }
    );

    if (response.data && response.data.display_name) {
      return response.data.display_name;
    } else {
      return `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(
        6
      )} (Address not found)`;
    }
  } catch (error) {
    console.error("Nominatim Geocoding Error:", error);
    return `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)} (Network Error)`;
  }
};

export const forwardGeocode = async (address) => {
  if (!address || typeof address !== "string" || address.trim() === "") {
    return null;
  }

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          "accept-language": "en",
          limit: 1,
        },
      }
    );

    if (Array.isArray(response.data) && response.data.length > 0) {
      const place = response.data[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        return [lon, lat];
      }
    }
    return null;
  } catch (error) {
    console.error("Nominatim Forward Geocoding Error:", error);
    return null;
  }
};

const DEFAULT_LON_LAT = [78.4744, 17.385]; // [lon, lat] Hyderabad (approx)
export const getInitialCenterForAddress = async (address) => {
  // Try to geocode the provided address
  try {
    const coords = await forwardGeocode(address);
    if (coords && coords.length === 2) {
      return fromLonLat(coords);
    }
  } catch (e) {
    // fall through to default
    console.error("Error while geocoding address for initial center:", e);
  }
  // Fallback default
  return fromLonLat(DEFAULT_LON_LAT);
};

// Backwards-compatible export of default center (projected) in case other code used it
export const initialCenter = fromLonLat(DEFAULT_LON_LAT);

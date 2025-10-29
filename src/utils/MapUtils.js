// src/utils/MapUtils.js
import axios from "axios";

// Function to convert Lat/Lon coordinates to a readable address using Nominatim (OpenStreetMap)
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

// OpenLayers coordinate conversion helper
import { fromLonLat } from "ol/proj";

export const initialCenter = fromLonLat([78.4744, 17.385]); // Default to Hyderabad, India (approximate center)

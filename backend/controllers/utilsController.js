const axios = require("axios");

// Server-side proxy for Nominatim reverse geocode
// GET /api/utils/reverse?lat=...&lon=...
exports.reverseGeocode = async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon)
    return res
      .status(400)
      .json({ success: false, message: "lat and lon required" });

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon,
          format: "json",
          "accept-language": "en",
          zoom: 18,
        },
        headers: {
          // IMPORTANT: Provide a descriptive User-Agent and contact per Nominatim usage policy
          "User-Agent": "CleanStreet/1.0 (contact@example.com)",
          Referer:
            req.get("origin") || req.get("referer") || "http://localhost",
        },
        timeout: 10000,
      }
    );

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("utilsController.reverseGeocode error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Geocoding failed",
      details: err.message,
    });
  }
};

// Server-side proxy for Nominatim forward geocode (address -> lon,lat)
// GET /api/utils/forward?q=address
exports.forwardGeocode = async (req, res) => {
  const { q } = req.query;
  if (!q)
    return res
      .status(400)
      .json({ success: false, message: "q (query) required" });

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q,
          format: "json",
          "accept-language": "en",
          limit: 1,
        },
        headers: {
          "User-Agent": "CleanStreet/1.0 (contact@example.com)",
          Referer:
            req.get("origin") || req.get("referer") || "http://localhost",
        },
        timeout: 10000,
      }
    );

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("utilsController.forwardGeocode error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Forward geocoding failed",
      details: err.message,
    });
  }
};

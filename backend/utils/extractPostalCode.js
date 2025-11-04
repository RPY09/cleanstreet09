exports.extractPostalCode = (address) => {
  try {
    if (!address || typeof address !== "string") return "Unknown";
    const parts = address.split(",");
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim(); // Always 2nd last part = ZIP
    }
    return "Unknown";
  } catch (error) {
    console.error("Error extracting postal code:", error);
    return "Unknown";
  }
};

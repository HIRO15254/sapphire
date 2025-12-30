/**
 * Google Maps URL generation utility.
 *
 * Generates URLs for opening locations in Google Maps.
 * Supports multiple input types with priority: placeId > coordinates > address
 *
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */

/** Input parameters for Google Maps URL generation */
export interface GoogleMapsUrlInput {
  /** Google Places API place ID (highest priority) */
  placeId?: string | null
  /** Latitude coordinate (-90 to 90) */
  latitude?: number | null
  /** Longitude coordinate (-180 to 180) */
  longitude?: number | null
  /** Street address (lowest priority) */
  address?: string | null
}

/**
 * Generate a Google Maps URL from location data.
 *
 * Priority order:
 * 1. Place ID - Most precise, links directly to the place
 * 2. Coordinates - Opens map at exact location
 * 3. Address - Searches for the address
 *
 * @param input - Location data (placeId, coordinates, or address)
 * @returns Google Maps URL or null if no valid location data provided
 *
 * @example
 * // With placeId
 * generateGoogleMapsUrl({ placeId: 'ChIJ51cu8IcbImARiRtXIothAS4' })
 * // => 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ51cu8IcbImARiRtXIothAS4'
 *
 * @example
 * // With coordinates
 * generateGoogleMapsUrl({ latitude: 35.6595, longitude: 139.7004 })
 * // => 'https://www.google.com/maps/search/?api=1&query=35.6595%2C139.7004'
 *
 * @example
 * // With address
 * generateGoogleMapsUrl({ address: '東京都渋谷区渋谷1-1-1' })
 * // => 'https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC...'
 */
export function generateGoogleMapsUrl(
  input: GoogleMapsUrlInput,
): string | null {
  const baseUrl = 'https://www.google.com/maps/search/?api=1'

  // Priority 1: Place ID
  if (input.placeId && input.placeId.trim() !== '') {
    return `${baseUrl}&query_place_id=${input.placeId}`
  }

  // Priority 2: Coordinates (both latitude and longitude required)
  if (
    input.latitude !== null &&
    input.latitude !== undefined &&
    input.longitude !== null &&
    input.longitude !== undefined
  ) {
    const query = `${input.latitude},${input.longitude}`
    return `${baseUrl}&query=${encodeURIComponent(query)}`
  }

  // Priority 3: Address
  if (input.address && input.address.trim() !== '') {
    return `${baseUrl}&query=${encodeURIComponent(input.address)}`
  }

  // No valid location data
  return null
}

import { describe, expect, it } from 'vitest'

/**
 * Unit tests for Google Maps URL generation utility.
 *
 * Tests the generation of Google Maps URLs from various input combinations:
 * - Place ID only
 * - Coordinates only
 * - Address only
 * - Multiple inputs (priority: placeId > coordinates > address)
 *
 * @see lib/google-maps.ts
 */
describe('generateGoogleMapsUrl', () => {
  describe('with placeId', () => {
    it('should generate URL with placeId when provided', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        placeId: 'ChIJ51cu8IcbImARiRtXIothAS4',
      })

      expect(result).toBe(
        'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ51cu8IcbImARiRtXIothAS4',
      )
    })

    it('should prioritize placeId over coordinates and address', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        placeId: 'ChIJ51cu8IcbImARiRtXIothAS4',
        latitude: 35.6595,
        longitude: 139.7004,
        address: '東京都渋谷区渋谷1-1-1',
      })

      expect(result).toBe(
        'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ51cu8IcbImARiRtXIothAS4',
      )
    })
  })

  describe('with coordinates', () => {
    it('should generate URL with coordinates when provided', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        latitude: 35.6595,
        longitude: 139.7004,
      })

      expect(result).toBe(
        'https://www.google.com/maps/search/?api=1&query=35.6595%2C139.7004',
      )
    })

    it('should handle negative coordinates', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        latitude: -33.8688,
        longitude: 151.2093,
      })

      expect(result).toBe(
        'https://www.google.com/maps/search/?api=1&query=-33.8688%2C151.2093',
      )
    })

    it('should prioritize coordinates over address', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        latitude: 35.6595,
        longitude: 139.7004,
        address: '東京都渋谷区渋谷1-1-1',
      })

      expect(result).toBe(
        'https://www.google.com/maps/search/?api=1&query=35.6595%2C139.7004',
      )
    })
  })

  describe('with address', () => {
    it('should generate URL with encoded address when provided', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        address: '東京都渋谷区渋谷1-1-1',
      })

      expect(result).toBe(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('東京都渋谷区渋谷1-1-1')}`,
      )
    })

    it('should handle English address', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        address: '123 Main St, Tokyo, Japan',
      })

      expect(result).toBe(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('123 Main St, Tokyo, Japan')}`,
      )
    })
  })

  describe('with no location data', () => {
    it('should return null when no location data is provided', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({})

      expect(result).toBeNull()
    })

    it('should return null when all fields are undefined', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        placeId: undefined,
        latitude: undefined,
        longitude: undefined,
        address: undefined,
      })

      expect(result).toBeNull()
    })

    it('should return null when all fields are null', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        placeId: null,
        latitude: null,
        longitude: null,
        address: null,
      })

      expect(result).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should return null when only latitude is provided (no longitude)', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        latitude: 35.6595,
      })

      expect(result).toBeNull()
    })

    it('should return null when only longitude is provided (no latitude)', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        longitude: 139.7004,
      })

      expect(result).toBeNull()
    })

    it('should return null for empty address string', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        address: '',
      })

      expect(result).toBeNull()
    })

    it('should return null for whitespace-only address string', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        address: '   ',
      })

      expect(result).toBeNull()
    })

    it('should return null for empty placeId string', async () => {
      const { generateGoogleMapsUrl } = await import('~/lib/google-maps')

      const result = generateGoogleMapsUrl({
        placeId: '',
      })

      expect(result).toBeNull()
    })
  })
})

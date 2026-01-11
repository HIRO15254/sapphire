/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js'

/** @type {import("next").NextConfig} */
const config = {
  headers: async () => [
    {
      // Service worker should not be cached aggressively
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Content-Type',
          value: 'application/javascript; charset=utf-8',
        },
      ],
    },
    {
      // Version info should not be cached for update detection
      source: '/version.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
  ],
}

export default config

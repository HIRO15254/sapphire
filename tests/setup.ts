import '@testing-library/dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 各テスト後にReactコンポーネントをクリーンアップ
afterEach(() => {
  cleanup()
})

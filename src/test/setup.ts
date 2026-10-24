import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom אינו מממש Blob.prototype.text, שבו משתמש שחזור הגיבוי מקובץ.
// בדפדפן השיטה קיימת; כאן היא נבנית מחדש מעל FileReader.
if (typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error)
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(this)
    })
  }
}

afterEach(() => {
  cleanup()
})

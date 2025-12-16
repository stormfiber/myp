import { fileURLToPath, pathToFileURL } from 'url'
import { dirname } from 'path'

class Helper {
  static __filename(importMeta, removeSuffix = false) {
    const filename = fileURLToPath(importMeta.url || importMeta)
    return removeSuffix ? filename : pathToFileURL(filename).href
  }

  static __dirname(importMeta) {
    return dirname(this.__filename(importMeta, true))
  }
}

export default Helper

// Make it available globally
global.__filename = function filename(pathURL, removeSuffix = false) {
  const filename = fileURLToPath(pathURL)
  return removeSuffix ? filename : pathToFileURL(filename).href
}

global.__dirname = function dirname(pathURL) {
  return dirname(global.__filename(pathURL, true))
}

/**
 * Import file with cache busting
 * @param {String} path File path
 */
export default async function importFile(path) {
  return await import(`${path}?update=${Date.now()}`)
}

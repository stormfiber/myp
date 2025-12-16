import { readdirSync, existsSync, readFileSync, watch } from 'fs'
import { join, resolve } from 'path'
import { format } from 'util'
import syntaxerror from 'syntax-error'
import Helper from './helper.js'

const __dirname = Helper.__dirname(import.meta)
const pluginFilter = filename => /\.js$/.test(filename)

let watcher = {}
let plugins = {}
let pluginFolders = []

async function filesInit(pluginFolder, pluginFilter, conn) {
  const folder = resolve(pluginFolder)
  if (folder in watcher) return
  pluginFolders.push(folder)

  await Promise.all(
    readdirSync(folder)
      .filter(pluginFilter)
      .map(async filename => {
        try {
          let file = Helper.__filename(join(folder, filename))
          const module = await import(file + '?update=' + Date.now())
          if (module) plugins[filename] = module
        } catch (e) {
          conn?.logger.error(e)
          delete plugins[filename]
        }
      })
  )

  const watching = watch(folder, reload.bind(null, conn, folder, pluginFilter))
  watching.on('close', () => deletePluginFolder(folder, true))
  watcher[folder] = watching

  return plugins
}

function deletePluginFolder(folder, isAlreadyClosed = false) {
  const resolved = resolve(folder)
  if (!(resolved in watcher)) return
  if (!isAlreadyClosed) watcher[resolved].close()
  delete watcher[resolved]
  pluginFolders.splice(pluginFolders.indexOf(resolved), 1)
}

async function reload(conn, pluginFolder, pluginFilter, _ev, filename) {
  if (pluginFilter(filename)) {
    let dir = Helper.__filename(join(pluginFolder, filename), true)
    if (filename in plugins) {
      if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`)
      else {
        conn?.logger.warn(`deleted plugin - '${filename}'`)
        return delete plugins[filename]
      }
    } else conn?.logger.info(`new plugin - '${filename}'`)
    
    let err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    
    if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
    else {
      try {
        const module = await import(Helper.__filename(dir) + '?update=' + Date.now())
        if (module) plugins[filename] = module
      } catch (e) {
        conn?.logger.error(`error require plugin '${filename}\n${format(e)}'`)
      } finally {
        plugins = Object.fromEntries(Object.entries(plugins).sort(([a], [b]) => a.localeCompare(b)))
      }
    }
  }
}

export {
  pluginFilter,
  plugins,
  watcher,
  pluginFolders,
  filesInit,
  deletePluginFolder,
  reload,
}

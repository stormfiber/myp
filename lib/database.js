import { resolve, dirname as _dirname } from 'path'
import _fs, { existsSync, readFileSync } from 'fs'
const { promises: fs } = _fs

class Database {
  /**
   * Create new Database
   * @param {String} filepath Path to specified json database
   * @param  {...any} args JSON.stringify arguments
   */
  constructor(filepath, ...args) {
    this.file = resolve(filepath)
    this.logger = console

    this._load()

    this._jsonargs = args
    this._state = false
    this._queue = []
    
    // Auto-save interval
    this._interval = setInterval(async () => {
      if (!this._state && this._queue && this._queue[0]) {
        this._state = true
        await this[this._queue.shift()]().catch(this.logger.error)
        this._state = false
      }
    }, 1000)
  }

  get data() {
    return this._data
  }

  set data(value) {
    this._data = value
    this.save()
  }

  /**
   * Queue Load
   */
  load() {
    this._queue.push('_load')
  }

  /**
   * Queue Save
   */
  save() {
    this._queue.push('_save')
  }

  _load() {
    try {
      return (this._data = existsSync(this.file) ? JSON.parse(readFileSync(this.file)) : {})
    } catch (e) {
      this.logger.error(e)
      return (this._data = {})
    }
  }

  async _save() {
    let dirname = _dirname(this.file)
    if (!existsSync(dirname)) await fs.mkdir(dirname, { recursive: true })

    // Use a custom stringifier to safely handle circular refs and Timers
    const data = JSON.stringify(this._data, (key, value) => {
      // 1. Remove Circular References
      if (value === this._data && key !== '') return undefined
      
      // 2. Remove Timeout/Timer objects (The cause of your crash)
      if (value && typeof value === 'object') {
          if (value.constructor && (value.constructor.name === 'Timeout' || value.constructor.name === 'Timer')) {
              return undefined
          }
      }
      return value
    }, ...this._jsonargs)

    await fs.writeFile(this.file, data)
    return this.file
  }
}

export default Database


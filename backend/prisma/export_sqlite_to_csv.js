const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const DB_PATH = path.join(__dirname, 'dev.db')
const OUT_DIR = path.join(__dirname, 'exports')
const TABLES = ['employees', 'rates', 'calculations']

if (!fs.existsSync(DB_PATH)) {
  console.error('SQLite DB not found at', DB_PATH)
  process.exit(1)
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err)
    process.exit(1)
  }
})

function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function exportTable(table) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, async (err, rows) => {
      if (err) return reject(err)

      let headers = []
      if (rows && rows.length > 0) headers = Object.keys(rows[0])
      else {
        // fallback: query pragma
        db.all(`PRAGMA table_info(${table})`, (err2, cols) => {
          if (err2) return reject(err2)
          headers = cols.map(c => c.name)
        })
      }

      // Wait briefly if headers set by PRAGMA async callback
      await new Promise(r => setTimeout(r, 50))

      const outPath = path.join(OUT_DIR, `${table}.csv`)
      const stream = fs.createWriteStream(outPath, { encoding: 'utf8' })
      stream.write(headers.join(',') + '\n')

      if (rows && rows.length > 0) {
        for (const row of rows) {
          const line = headers.map(h => escapeCsv(row[h])).join(',')
          stream.write(line + '\n')
        }
      }

      stream.end(() => {
        console.log(`Exported ${table} -> ${outPath}`)
        resolve()
      })
    })
  })
}

;(async () => {
  try {
    for (const t of TABLES) {
      await exportTable(t)
    }
    console.log('All tables exported to', OUT_DIR)
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    db.close()
  }
})()

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const dir = __dirname

console.log('Building shared package')
execSync('tsc', { cwd: dir, stdio: 'inherit' })

const cjsDir = path.join(dir, 'dist', 'cjs')
if (fs.existsSync(cjsDir)) {
  for (const f of fs.readdirSync(cjsDir)) {
    if (f.endsWith('.js')) {
      fs.renameSync(
        path.join(cjsDir, f),
        path.join(cjsDir, f.replace(/\.js$/, '.cjs'))
      )
    }
  }
  console.log('Renamed .js to .cjs in dist/cjs')
} else {
  console.log('dist/cjs not found, skipping rename')
}
console.log('Shared package built')

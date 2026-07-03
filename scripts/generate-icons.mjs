import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

function svgToPng(svgPath, outPath, width) {
  const svg = readFileSync(join(root, svgPath), 'utf8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  })
  const png = resvg.render().asPng()
  writeFileSync(join(root, outPath), png)
  console.log(`✓ ${outPath} (${width}px)`)
}

svgToPng('og.svg', 'og.png', 1200)
svgToPng('pwa-icon.svg', 'pwa-192.png', 192)
svgToPng('pwa-icon.svg', 'pwa-512.png', 512)

console.log('Done.')

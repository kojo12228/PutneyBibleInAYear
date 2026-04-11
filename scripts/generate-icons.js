import { favicons } from 'favicons'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const source = 'orb-and-cross.jpg'
const outputDir = 'public'

const config = {
  appName: 'Bible in a Year',
  appShortName: 'BibleYear',
  appDescription: 'Daily Bible reading tracker — Putney Methodist Church',
  background: '#ffffff',
  theme_color: '#DA1E28',
  icons: {
    android: ['android-chrome-192x192.png', 'android-chrome-512x512.png'],
    appleIcon: ['apple-touch-icon.png'],
    favicons: true,
    windows: false,
    yandex: false,
    appleStartup: false,
    coast: false,
    firefox: false,
  },
}

console.log('Generating icons from', source, '...')
const response = await favicons(source, config)

for (const image of response.images) {
  const dest = join(outputDir, image.name)
  writeFileSync(dest, image.contents)
  console.log('  Written:', dest)
}

// Rename to the filenames expected by the PWA manifest and index.html
import { renameSync, existsSync } from 'fs'

const renames = [
  ['android-chrome-192x192.png', 'icon-192.png'],
  ['android-chrome-512x512.png', 'icon-512.png'],
]
for (const [from, to] of renames) {
  const src = join(outputDir, from)
  const dst = join(outputDir, to)
  if (existsSync(src)) {
    renameSync(src, dst)
    console.log('  Renamed:', from, '->', to)
  }
}

console.log('Done.')

# Bible in a Year

[![Netlify Status](https://api.netlify.com/api/v1/badges/3666a28e-1dbd-4099-a6ca-f910ea49712f/deploy-status)](https://app.netlify.com/projects/putneybinay/deploys)

A progressive web app for the **Bible in a Year** reading plan run by [Putney Methodist Church](https://www.putneymethodistchurch.org.uk/bibleinayear.htm) (28 March 2026 – 27 March 2027).

**Live app: [putneybinay.netlify.app](https://putneybinay.netlify.app)**

## Features

- Shows today's Bible reading (Old Testament, Psalm/Proverb, New Testament)
- Daily push notifications at a time of your choosing
- Works offline after first visit
- Installable as a home screen app on Android and iOS

## iOS setup for notifications

Notifications on iPhone and iPad require the app to be installed to the home screen first:

1. Open the app in Safari
2. Tap the Share button at the bottom of the screen
3. Tap "Add to Home Screen"
4. Open the app from your home screen and enable notifications

Requires iOS 16.4 or later.

## Development

Built with [Vite](https://vite.dev) and [Tailwind CSS](https://tailwindcss.com).

**Prerequisites:** Node.js, pnpm

```bash
pnpm install
pnpm dev        # start dev server at localhost:5173
pnpm build      # production build to dist/
pnpm preview    # preview production build locally
```

### Regenerating icons

Icons are generated from a source image using the [favicons](https://github.com/itgalaxy/favicons) package:

```bash
# Place source image at orb-and-cross.jpg then run:
pnpm generate-icons
```

## Credits

- Reading plan by Rev'd Geoffrey Farrar, Putney Methodist Church
- [The Methodist Church orb and cross logo](https://www.methodist.org.uk/about/methodist-logos-and-visual-identity/the-orb-and-cross/) © The Methodist Church

## License

[MIT](./LICENSE)

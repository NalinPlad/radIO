# radIO

A web-based radio player that streams content from Internet Archive collections.

## Development

### Setup

1. Install dependencies:

```bash
yarn install
```

2. Generate radio data (required before running the app):

```bash
yarn run generate-radio-data
```

3. Start the development server:

```bash
yarn dev
```

### Building for Production

The build process automatically generates the radio data before building:

```bash
yarn build
```

This will:

1. Run `yarn run generate-radio-data` to fetch and cache all radio station data
2. Build the production version of the app

## Radio Data Generation

The `scripts/generate-radio-data.js` script:

- Fetches metadata for all configured radio stations from Internet Archive
- Generates direct streaming URLs for each station
- Saves the data to `src/data/radio-data.json`

This eliminates the need for API calls at runtime, making the app faster and more reliable.

### Adding New Stations

To add a new radio station:

1. Add the station configuration to the `STATIONS` array in `scripts/generate-radio-data.js`
2. Run `yarn run generate-radio-data` to update the data
3. The new station will be available in the app

**Note**: The component automatically uses the generated data, so there's no need to maintain separate station configurations in the component.

## Project Structure

```
├── src/
│   ├── components/
│   │   └── Radio.svelte      # Main radio player component
│   └── data/
│       └── radio-data.json   # Generated radio station data
├── scripts/
│   └── generate-radio-data.js # Build script for radio data
└── package.json
```

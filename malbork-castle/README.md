# ArcGIS Maps SDK for JavaScript Vite React 19 TSX template

📁 **[Click here to download this directory as a ZIP file](https://esri.github.io/jsapi-resources/zips/js-maps-sdk-react.zip)** 📁

This template demonstrates how to use the [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/) in a Vite React 19 TSX application.

## Run locally

From the project root, install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`, which you can open in your browser.

For a production build and local preview:

```bash
npm run build
npm run preview
```

## Get started

To quickly scaffold a new application using this template, run the following command in your terminal:

```bash
npx @arcgis/create -n my-arcgis-app -t react
```

This template uses the following packages:

- [`@arcgis/core`](https://www.npmjs.com/package/@arcgis/core)
- [`@arcgis/map-components`](https://www.npmjs.com/package/@arcgis/map-components)
- [`@arcgis/charts-components`](https://www.npmjs.com/package/@arcgis/charts-components)
- [`@esri/calcite-components`](https://www.npmjs.com/package/@esri/calcite-components)

## TypeScript

This template is configured to use TypeScript. If you prefer to use JavaScript, you can:

- Remove the `tsconfig.json` file
- Update the file extensions from `.tsx` to `.jsx`
- Remove the `vite.env.d.ts` file
- Remove the `typescript` dependency from `package.json`
- Remove the `@types/node`, `@types/react` and `@types/react-dom` dev dependencies from `package.json`

## Resources

See the [Get started with npm guide](https://developers.arcgis.com/javascript/latest/get-started/#use-arcgiscreate) for full instructions.

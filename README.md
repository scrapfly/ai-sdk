# @scrapfly/ai-sdk

[Scrapfly](https://scrapfly.io) web scraping, AI data extraction and screenshots as tools for the [Vercel AI SDK](https://ai-sdk.dev).

## Install

```bash
pnpm add @scrapfly/ai-sdk ai zod
```

Set your API key from the [Scrapfly dashboard](https://scrapfly.io/dashboard):

```bash
export SCRAPFLY_API_KEY=scp-live-...
```

## Usage

```ts
import { generateText, stepCountIs } from 'ai';
import { scrapflyScrape, scrapflyExtract, scrapflyScreenshot } from '@scrapfly/ai-sdk';

const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    scrapflyScrape: scrapflyScrape(),
    scrapflyExtract: scrapflyExtract(),
    scrapflyScreenshot: scrapflyScreenshot(),
  },
  stopWhen: stepCountIs(5),
  prompt: 'Read https://web-scraping.dev/products and list the first three product names.',
});
```

Every factory takes optional settings:

```ts
scrapflyScrape({
  apiKey: 'scp-live-...',
  defaults: { asp: true, renderJs: true },
});
```

- `apiKey`: used instead of `SCRAPFLY_API_KEY`.
- `client`: your own `ScrapflyClient` from `scrapfly-sdk`.
- `defaults`: input values used when the model does not set them.

The key is read when the tool runs. A missing key throws an error that names `SCRAPFLY_API_KEY`.

## Tools

### `scrapflyScrape`

Fetches a page and returns `{ url, statusCode, content }`.

| Input | Type | Description |
| --- | --- | --- |
| `url` | string, required | Page to scrape |
| `renderJs` | boolean | Render the page in a headless browser |
| `asp` | boolean | Anti-scraping protection bypass |
| `country` | string | Proxy country code, for example `us` |
| `format` | `markdown` (default), `text`, `clean_html` | Format of the content |
| `waitForSelector` | string | CSS selector to wait for, with `renderJs` |

### `scrapflyExtract`

Extracts data from a page with a natural language prompt and returns `{ url, data }`. The anti-scraping protection bypass is always on.

| Input | Type | Description |
| --- | --- | --- |
| `url` | string, required | Page to extract from |
| `prompt` | string, required | What to extract |

### `scrapflyScreenshot`

Takes a JPEG screenshot and returns it to the model as an image. The tool result also holds `{ url, mediaType, base64 }`.

| Input | Type | Description |
| --- | --- | --- |
| `url` | string, required | Page to capture |
| `capture` | string | `fullpage` (default) or a CSS selector |
| `resolution` | string | Viewport size, for example `1920x1080` |

## Docs

Full API reference: https://scrapfly.io/docs

## License

MIT

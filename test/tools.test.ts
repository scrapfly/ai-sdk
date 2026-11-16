import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrapflyExtract, scrapflyScrape, scrapflyScreenshot } from '../src/index.js';
import type { ScrapflyClientLike } from '../src/index.js';

const callOptions = { toolCallId: 'call-1', messages: [], context: {} };

const fakeClient = () => {
  const scrape = vi.fn(async () => ({
    result: { content: '# Hello', status_code: 200, extracted_data: { data: { title: 'Hi' } } },
  }));
  const screenshot = vi.fn(async () => ({ image: new Uint8Array([1, 2, 3]).buffer }));
  return { scrape, screenshot } as unknown as ScrapflyClientLike & {
    scrape: ReturnType<typeof vi.fn>;
    screenshot: ReturnType<typeof vi.fn>;
  };
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('scrapflyScrape', () => {
  it('scrapes with the mapped config and returns the content', async () => {
    const client = fakeClient();
    const out = await scrapflyScrape({ client }).execute!(
      { url: 'https://example.com', renderJs: true, asp: true, country: 'us', waitForSelector: '#a' },
      callOptions,
    );
    const config = client.scrape.mock.calls[0][0];
    expect(config).toMatchObject({
      url: 'https://example.com',
      render_js: true,
      asp: true,
      country: 'us',
      format: 'markdown',
      wait_for_selector: '#a',
    });
    expect(out).toEqual({ url: 'https://example.com', statusCode: 200, content: '# Hello' });
  });

  it('turns on rendering when a selector is given', async () => {
    const client = fakeClient();
    await scrapflyScrape({ client }).execute!({ url: 'https://example.com', waitForSelector: '#x' }, callOptions);
    expect(client.scrape.mock.calls[0][0]).toMatchObject({ render_js: true, wait_for_selector: '#x' });
  });

  it('applies defaults and lets the input override them', async () => {
    const client = fakeClient();
    await scrapflyScrape({ client, defaults: { asp: true, format: 'text' } }).execute!(
      { url: 'https://example.com', format: 'clean_html' },
      callOptions,
    );
    expect(client.scrape.mock.calls[0][0]).toMatchObject({ asp: true, format: 'clean_html' });
  });

  it('throws naming SCRAPFLY_API_KEY when no key is set', async () => {
    vi.stubEnv('SCRAPFLY_API_KEY', '');
    await expect(
      scrapflyScrape().execute!({ url: 'https://example.com' }, callOptions),
    ).rejects.toThrow('SCRAPFLY_API_KEY');
  });
});

describe('scrapflyExtract', () => {
  it('scrapes with the prompt and asp and returns the data', async () => {
    const client = fakeClient();
    const out = await scrapflyExtract({ client }).execute!(
      { url: 'https://example.com', prompt: 'the title' },
      callOptions,
    );
    expect(client.scrape.mock.calls[0][0]).toMatchObject({
      url: 'https://example.com',
      asp: true,
      extraction_prompt: 'the title',
    });
    expect(out).toEqual({ url: 'https://example.com', data: { title: 'Hi' } });
  });

  it('throws naming SCRAPFLY_API_KEY when no key is set', async () => {
    vi.stubEnv('SCRAPFLY_API_KEY', '');
    await expect(
      scrapflyExtract().execute!({ url: 'https://example.com', prompt: 'x' }, callOptions),
    ).rejects.toThrow('SCRAPFLY_API_KEY');
  });
});

describe('scrapflyScreenshot', () => {
  it('captures the viewport by default and returns base64 plus image model output', async () => {
    const client = fakeClient();
    const t = scrapflyScreenshot({ client });
    const out = await t.execute!({ url: 'https://example.com', resolution: '800x600' }, callOptions);
    expect(client.screenshot.mock.calls[0][0]).toMatchObject({
      url: 'https://example.com',
      resolution: '800x600',
      format: 'jpg',
    });
    expect(client.screenshot.mock.calls[0][0].capture).toBe('viewport');
    expect(out).toEqual({
      url: 'https://example.com',
      mediaType: 'image/jpeg',
      base64: 'AQID',
    });
    const modelOutput = await t.toModelOutput!({
      toolCallId: 'call-1',
      input: { url: 'https://example.com' },
      output: out as { url: string; mediaType: string; base64: string },
    });
    expect(modelOutput).toEqual({
      type: 'content',
      value: [{ type: 'file', data: { type: 'data', data: 'AQID' }, mediaType: 'image/jpeg' }],
    });
  });

  it('passes a CSS selector as capture', async () => {
    const client = fakeClient();
    await scrapflyScreenshot({ client }).execute!(
      { url: 'https://example.com', capture: '#main' },
      callOptions,
    );
    expect(client.screenshot.mock.calls[0][0]).toMatchObject({ capture: '#main' });
  });

  it('throws naming SCRAPFLY_API_KEY when no key is set', async () => {
    vi.stubEnv('SCRAPFLY_API_KEY', '');
    await expect(
      scrapflyScreenshot().execute!({ url: 'https://example.com' }, callOptions),
    ).rejects.toThrow('SCRAPFLY_API_KEY');
  });
});

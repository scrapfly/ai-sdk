import { tool, type Tool } from 'ai';
import { ScrapeConfig } from 'scrapfly-sdk';
import { z } from 'zod';
import { resolveClient, type ScrapflyToolOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The URL of the page to scrape.'),
  renderJs: z
    .boolean()
    .optional()
    .describe('Render the page in a headless browser. Enable for JavaScript-heavy pages.'),
  asp: z
    .boolean()
    .optional()
    .describe('Enable the anti-scraping protection bypass. Enable for sites that block bots.'),
  country: z
    .string()
    .optional()
    .describe('Two-letter country code of the proxy to use, for example "us".'),
  format: z
    .enum(['markdown', 'text', 'clean_html'])
    .optional()
    .describe('Format of the returned content. Defaults to markdown.'),
  waitForSelector: z
    .string()
    .optional()
    .describe('CSS selector to wait for before returning. Turns on rendering.'),
});

export type ScrapflyScrapeInput = z.infer<typeof inputSchema>;
export type ScrapflyScrapeOutput = { url: string; statusCode: number; content: string };

export const scrapflyScrape = (options: ScrapflyToolOptions<ScrapflyScrapeInput> = {}): Tool<ScrapflyScrapeInput, ScrapflyScrapeOutput> =>
  tool({
    description:
      'Fetch a web page through Scrapfly and return its content as markdown, text or cleaned HTML. Handles anti-bot protection and JavaScript rendering.',
    inputSchema,
    execute: async (input) => {
      const { url, renderJs, asp, country, format, waitForSelector } = {
        ...options.defaults,
        ...input,
      };
      const response = await resolveClient(options).scrape(
        new ScrapeConfig({
          url,
          render_js: waitForSelector ? true : renderJs,
          asp,
          country,
          format: format ?? 'markdown',
          wait_for_selector: waitForSelector,
        }),
      );
      if (response instanceof Response) throw new Error('unexpected streaming scrape response');
      return {
        url,
        statusCode: response.result.status_code,
        content: response.result.content,
      };
    },
  });

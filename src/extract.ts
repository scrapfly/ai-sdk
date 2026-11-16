import { tool, type Tool } from 'ai';
import { ScrapeConfig } from 'scrapfly-sdk';
import { z } from 'zod';
import { resolveClient, type ScrapflyToolOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The URL of the page to extract data from.'),
  prompt: z
    .string()
    .describe('What to extract from the page, for example "the product name, price and rating".'),
});

export type ScrapflyExtractInput = z.infer<typeof inputSchema>;
export type ScrapflyExtractOutput = { url: string; data: unknown };

export const scrapflyExtract = (options: ScrapflyToolOptions<ScrapflyExtractInput> = {}): Tool<ScrapflyExtractInput, ScrapflyExtractOutput> =>
  tool({
    description:
      'Extract structured data from a web page with a natural language prompt, using Scrapfly AI extraction. Returns only the requested data.',
    inputSchema,
    execute: async (input) => {
      const { url, prompt } = { ...options.defaults, ...input };
      const response = await resolveClient(options).scrape(
        new ScrapeConfig({ url, asp: true, extraction_prompt: prompt }),
      );
      if (response instanceof Response) throw new Error('unexpected streaming scrape response');
      return { url, data: response.result.extracted_data?.data };
    },
  });

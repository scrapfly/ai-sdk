import { tool, type Tool } from 'ai';
import { ScreenshotConfig } from 'scrapfly-sdk';
import { z } from 'zod';
import { resolveClient, type ScrapflyToolOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The URL of the page to screenshot.'),
  capture: z
    .string()
    .optional()
    .describe('Defaults to the viewport. Use a CSS selector to capture one element, or "fullpage" for the whole page, which may be too large for some models.'),
  resolution: z
    .string()
    .optional()
    .describe('Viewport size as widthxheight, for example "1920x1080".'),
});

export type ScrapflyScreenshotInput = z.infer<typeof inputSchema>;
export type ScrapflyScreenshotOutput = { url: string; mediaType: string; base64: string };

export const scrapflyScreenshot = (options: ScrapflyToolOptions<ScrapflyScreenshotInput> = {}): Tool<ScrapflyScreenshotInput, ScrapflyScreenshotOutput> =>
  tool({
    description:
      'Take a screenshot of a web page through Scrapfly and return it as an image. Captures the viewport by default, or a single element, or the full page.',
    inputSchema,
    execute: async (input) => {
      const { url, capture, resolution } = { ...options.defaults, ...input };
      const result = await resolveClient(options).screenshot(
        new ScreenshotConfig({
          url,
          format: 'jpg',
          capture: capture ?? 'viewport',
          resolution,
        }),
      );
      return {
        url,
        mediaType: 'image/jpeg',
        base64: Buffer.from(result.image).toString('base64'),
      };
    },
    toModelOutput: ({ output }) => ({
      type: 'content',
      value: [
        {
          type: 'file',
          data: { type: 'data', data: output.base64 },
          mediaType: output.mediaType,
        },
      ],
    }),
  });

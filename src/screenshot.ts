import { tool, type Tool } from 'ai';
import { ScreenshotConfig } from 'scrapfly-sdk';
import { z } from 'zod';
import { resolveClient, type ScrapflyToolOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The URL of the page to screenshot.'),
  capture: z
    .string()
    .optional()
    .describe('"fullpage" (default) or a CSS selector of the element to capture.'),
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
      'Take a screenshot of a web page through Scrapfly and return it as an image. Capture the full page or a single element.',
    inputSchema,
    execute: async (input) => {
      const { url, capture, resolution } = { ...options.defaults, ...input };
      const result = await resolveClient(options).screenshot(
        new ScreenshotConfig({
          url,
          format: 'jpg',
          capture: capture ?? 'fullpage',
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

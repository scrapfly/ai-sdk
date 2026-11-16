import { ScrapflyClient } from 'scrapfly-sdk';

export type ScrapflyClientLike = Pick<ScrapflyClient, 'scrape' | 'screenshot'>;

export type ScrapflyToolOptions<Input> = {
  apiKey?: string;
  client?: ScrapflyClientLike;
  defaults?: Partial<Input>;
};

export const resolveClient = (options: {
  apiKey?: string;
  client?: ScrapflyClientLike;
}): ScrapflyClientLike => {
  if (options.client) return options.client;
  const key = options.apiKey ?? process.env.SCRAPFLY_API_KEY;
  if (!key) {
    throw new Error(
      'Scrapfly API key is missing: set the SCRAPFLY_API_KEY environment variable or pass { apiKey }',
    );
  }
  return new ScrapflyClient({ key });
};

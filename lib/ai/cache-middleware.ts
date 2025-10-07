import { getRedisClient } from '@/lib/redis'

import {
  type LanguageModelMiddleware,
  simulateReadableStream,
} from 'ai';

const redis = getRedisClient();
const DEFAULT_TTL = 30 * 60; // 30 minutes in seconds

export function generateCacheKey(query: string, params?: Record<string, any>): string {
    const queryHash = Buffer.from(query).toString('base64')
    const paramsHash = params ? Buffer.from(JSON.stringify(params)).toString('base64') : ''
    const fullKey = `ai:${queryHash}:${paramsHash}`
    return fullKey
  }


export const cacheMiddleware: LanguageModelMiddleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = generateCacheKey('ai-cache:'+ JSON.stringify(params));
    

    const cachedString = await redis.get(cacheKey);
    if (cachedString !== null) {
      const cached = JSON.parse(cachedString as string);
      return {
        ...cached,
        response: {
          ...cached.response,
          timestamp: cached?.response?.timestamp
            ? new Date(cached?.response?.timestamp)
            : undefined,
        },
      };
    }

    const result = await doGenerate();

    redis.set(cacheKey, JSON.stringify(result), 'EX', DEFAULT_TTL);

    return result;
  },
  wrapStream: async ({ doStream, params }) => {
    const cacheKey = generateCacheKey('ai-cache:'+ JSON.stringify(params));

   
    
    

    // Check if the result is in the cache
    const cachedString = await redis.get(cacheKey);
    const cached = cachedString ? JSON.parse(cachedString as string) : null;

    // If cached, return a simulated ReadableStream that yields the cached result
    if (cached !== null) {
      // Format the timestamps in the cached response
      const formattedChunks = (cached as any[]).map((p: any) => {
        if (p.type === 'response-metadata' && p.timestamp) {
          return { ...p, timestamp: new Date(p.timestamp) };
        } else return p;
      });
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 10,
          chunks: formattedChunks,
        }),
      };
    }

    // If not cached, proceed with streaming
    const { stream, ...rest } = await doStream();

    const fullResponse: any[] = [];

    const transformStream = new TransformStream<any, any>({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // Store the full response in the cache after streaming is complete
        redis.set(cacheKey, JSON.stringify(fullResponse), 'EX', DEFAULT_TTL);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
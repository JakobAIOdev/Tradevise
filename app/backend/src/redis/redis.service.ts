import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private readonly channelHandlers = new Map<
    string,
    Set<(message: string) => void>
  >();

  constructor(config: ConfigService) {
    const host = config.getOrThrow<string>('REDIS_HOST');
    const port = config.getOrThrow<number>('REDIS_PORT');

    this.client = new Redis(port, host);
    this.subscriber = new Redis(port, host);
    this.subscriber.on('message', (channel, message) => {
      const handlers = this.channelHandlers.get(channel);
      if (!handlers) return;

      for (const handler of handlers) {
        handler(message);
      }
    });
  }

  async enqueueBootstrapOnce(symbol: string) {
    const queuedKey = `bootstrapqueued:${symbol}`;
    const processingKey = `bootstraplock:${symbol}`;
    const queuedTtlSeconds = 10 * 60;

    const result = await this.client.eval(
      `
      if redis.call("EXISTS", KEYS[1]) == 1 or redis.call("EXISTS", KEYS[2]) == 1 then
        return 0
      end

      redis.call("SET", KEYS[1], "1", "EX", ARGV[1])
      redis.call("LPUSH", KEYS[3], ARGV[2])
      return 1
      `,
      3,
      queuedKey,
      processingKey,
      'bootstrapqueue',
      queuedTtlSeconds,
      symbol,
    );

    return Number(result) === 1;
  }

  async requestImmediateLivePrice(symbol: string) {
    await this.client.publish('stocklive:fetchnow', symbol);
  }

  async requestImmediateStockMeta(symbol: string) {
    await this.client.publish('stockmeta:fetchnow', symbol);
  }

  async getJson<T>(key: string) {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async incrementActiveSubscriber(symbol: string) {
    return this.client.incr(`active:count:${symbol}`);
  }

  async decrementActiveSubscriber(symbol: string) {
    const count = await this.client.decr(`active:count:${symbol}`);
    if (count <= 0) {
      await this.client.srem('active:symbols', symbol);
    }
    return count;
  }

  async markSymbolActive(symbol: string) {
    await this.client
      .multi()
      .sadd('active:symbols', symbol)
      .set(`active:seen:${symbol}`, '1', 'EX', 90)
      .exec();
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    let handlers = this.channelHandlers.get(channel);

    if (!handlers) {
      handlers = new Set();
      this.channelHandlers.set(channel, handlers);
      await this.subscriber.subscribe(channel);
    }

    handlers.add(callback);
  }

  async unsubscribe(channel: string, callback?: (message: string) => void) {
    const handlers = this.channelHandlers.get(channel);
    if (!handlers) return;

    if (callback) {
      handlers.delete(callback);
    } else {
      handlers.clear();
    }

    if (handlers.size > 0) return;

    this.channelHandlers.delete(channel);
    await this.subscriber.unsubscribe(channel);
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.subscriber.disconnect();
  }
}

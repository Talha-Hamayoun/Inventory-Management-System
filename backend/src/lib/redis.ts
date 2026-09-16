import { RedisClient } from "bun";

export const redisClient = new RedisClient(process.env.REDIS_URL)
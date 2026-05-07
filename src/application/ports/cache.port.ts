export interface CachePort {
  readThrough<T>(key: string, loader: () => Promise<T>): Promise<T>;
}

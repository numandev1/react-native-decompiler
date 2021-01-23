

/**
 * Map that supports multiple values in one key
 */
export default class ArrayMap<K, V> implements Map<K, V[]> {
  private map: Map<K, V[]> = new Map<K, V[]>();

  /**
   * Gets the given key array
   * @param key The key to get
   */
  get(key: K): V[] {
    if (!this.map.get(key)) {
      this.map.set(key, []);
    }
    return this.map.get(key) ?? [];
  }

  /**
   * Returns if the given key has elements in it
   * @param key The key to find
   */
  has(key: K): boolean {
    return this.get(key).length > 0;
  }

  /**
   * Pushes the given value into the given key
   * @param key The key to push a value into
   * @param value The value to push
   */
  push(key: K, value: V): void {
    this.get(key).push(value);
  }

  /**
   * Iterates through each element of the given key
   * @param key The key to iterate through
   * @param fn The callback function
   */
  forEachElement(key: K, fn: (value: V, index: number, array: V[]) => void): void {
    this.get(key).forEach(fn);
  }

  // passthrough functions
  get size(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  delete(key: K): boolean {
    return this.map.delete(key);
  }
  forEach(callbackfn: (value: V[], key: K, map: Map<K, V[]>) => void, thisArg?: unknown): void {
    this.map.forEach(callbackfn, thisArg);
  }
  set(key: K, value: V[]): this {
    this.map.set(key, value);
    return this;
  }
  [Symbol.iterator](): IterableIterator<[K, V[]]> {
    return this.map.entries();
  }
  entries(): IterableIterator<[K, V[]]> {
    return this.map.entries();
  }
  keys(): IterableIterator<K> {
    return this.map.keys();
  }
  values(): IterableIterator<V[]> {
    return this.map.values();
  }
  [Symbol.toStringTag]: string;
}

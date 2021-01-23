

import { Binding } from '@babel/traverse';
import ArrayMap from './arrayMap';

/**
 * Map that supports multiple values in one key
 */
export default class BindingArrayMap<V> implements Map<Binding, V[]> {
  private map: ArrayMap<string, V[]> = new ArrayMap<string, V[]>();
  private innerBindingMap: ArrayMap<string, Binding> = new ArrayMap<string, Binding>();

  get size(): number {
    let size = 0;
    this.innerBindingMap.forEach((e) => {
      size += e.length;
    });
    return size;
  }

  get(key: Binding): V[] {
    const bindingIndex = this.findBindingIndex(key);
    return bindingIndex === -1 ? [] : this.map.get(key.identifier.name)[bindingIndex];
  }

  push(key: Binding, value: V): void {
    const bindingIndex = this.findOrPushBindingIndex(key);
    this.map.get(key.identifier.name)[bindingIndex].push(value);
  }

  forEachElement(key: Binding, callbackfn: (value: V) => void): void {
    this.get(key).forEach(callbackfn);
  }

  private findBindingIndex(binding: Binding): number {
    return this.innerBindingMap.get(binding.identifier.name).findIndex((e) => e === binding);
  }

  private findOrPushBindingIndex(binding: Binding): number {
    const bindingIndex = this.findBindingIndex(binding);
    if (bindingIndex === -1) {
      this.innerBindingMap.push(binding.identifier.name, binding);
      this.map.get(binding.identifier.name).push([]);
      return this.findBindingIndex(binding);
    }
    return bindingIndex;
  }

  clear(): void {
    throw new Error('Method not implemented.');
  }
  delete(_key: Binding): boolean {
    throw new Error('Method not implemented.');
  }
  forEach(_callbackfn: (value: V[], key: Binding, map: Map<Binding, V[]>) => void, _thisArg?: any): void {
    throw new Error('Method not implemented.');
  }
  has(_key: Binding): boolean {
    throw new Error('Method not implemented.');
  }
  set(_key: Binding, _value: V[]): this {
    throw new Error('Method not implemented.');
  }
  [Symbol.iterator](): IterableIterator<[Binding, V[]]> {
    throw new Error('Method not implemented.');
  }
  entries(): IterableIterator<[Binding, V[]]> {
    throw new Error('Method not implemented.');
  }
  keys(): IterableIterator<Binding> {
    throw new Error('Method not implemented.');
  }
  values(): IterableIterator<V[]> {
    throw new Error('Method not implemented.');
  }
  [Symbol.toStringTag]: string;
}

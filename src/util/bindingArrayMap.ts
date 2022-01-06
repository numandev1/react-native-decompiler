/**
  React Native Decompiler
  Copyright (C) 2020-2022 Richard Fu, Numan and contributors
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.
  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

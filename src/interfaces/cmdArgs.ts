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

export default interface CmdArgs {
  in: string;
  out: string;
  bundlesFolder: string;
  entry: number;
  performance: boolean;
  es6: boolean;
  verbose: boolean;
  decompileIgnored: boolean;
  /** skips some cache checks at the expense of possible cache desync */
  agressiveCache: boolean;
  noEslint: boolean;
  noPrettier: boolean;
  unpackOnly: boolean;
  noProgress: boolean;
  debug: number;
}

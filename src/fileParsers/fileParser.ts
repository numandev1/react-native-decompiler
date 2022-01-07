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

import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';

export default interface FileParser {
  /**
   * Determines if this parser can parse the app with the given args
   * @param args The command line args
   */
  canParse(args: CmdArgs): Promise<boolean>;

  /**
   * Parses the source files from the given args into modules
   * @param args The command line args
   */
  parse(args: CmdArgs): Promise<Module[]>;
}

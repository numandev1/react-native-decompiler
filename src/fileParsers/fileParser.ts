

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



import ParamMappings from './paramMappings';

export interface CachedFile {
  inputChecksum: string[];
  modules: CachedModule[];
}

export interface CachedModule {
  code: string;
  moduleId: number;
  dependencies: number[];
  originalDependencies: number[];
  moduleStrings: string[];
  moduleComments: string[];
  variableNames: string[];
  moduleName: string;
  npmModuleVarName?: string;
  isNpmModule: boolean;
  isPolyfill: boolean;
  isStatic: boolean;
  staticContent: string;
  ignored: boolean;
  previousRunChecksum: string;
  paramMappings: ParamMappings;
}

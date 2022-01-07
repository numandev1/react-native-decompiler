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

import { NodePath } from '@babel/traverse';
import generator from '@babel/generator';
import crypto from 'crypto';
import {
  Identifier, BlockStatement, File, FunctionExpression, expressionStatement,
} from '@babel/types';
import ParamMappings from './interfaces/paramMappings';
import { CachedModule } from './interfaces/cachedFile';

export default class Module {
  /** The original file that held this module */
  originalFile: File;
  /** The root path describing the function enclosing the module in the original file */
  rootPath: NodePath<FunctionExpression>;
  /** The module code */
  moduleCode: BlockStatement;
  /** The ID of the module */
  moduleId: number;
  /** The dependencies of this module */
  dependencies: number[];
  /** The param mapping used */
  private paramMappings: ParamMappings;
  /** Original deps used for cache */
  private originalDependencies: number[];

  /** The module's global variable */
  globalsParam?: Identifier;
  /** The module's require variable */
  requireParam?: Identifier;
  /** The module's module variable */
  moduleParam?: Identifier;
  /** The module's exports variable */
  exportsParam?: Identifier;

  originalCode = '';
  previousRunChecksum = '';
  moduleStrings: string[] = [];
  moduleComments: string[] = [];
  variableNames: Set<string> = new Set();

  // modifiable fields
  /** The name of the module */
  moduleName: string;
  /** The variable to use if this is an NPM module */
  npmModuleVarName?: string;
  /** If this is a NPM module */
  isNpmModule = false;
  /** If this is a polyfill */
  isPolyfill = false;
  /** If this is a static content. You should also set the ignored flag */
  isStatic = false;
  /** If this is static content, what the content is */
  staticContent = '';
  /** If the module should not be decompiled nor outputted */
  ignored = false;
  /** If the module failed to decompile */
  failedToDecompile = false;
  /** The module tags */
  tags: string[] = [];

  constructor(originalFile: File, rootPath: NodePath<FunctionExpression>, moduleId: number, dependencies: number[], paramMappings: ParamMappings) {
    this.originalFile = originalFile;
    this.rootPath = rootPath;
    this.moduleId = moduleId;
    this.dependencies = dependencies;
    this.originalDependencies = dependencies;
    this.paramMappings = paramMappings;

    this.moduleCode = rootPath.node.body;
    this.moduleName = this.moduleId.toString();

    this.globalsParam = this.getFunctionParam(paramMappings.globals);
    this.requireParam = this.getFunctionParam(paramMappings.require);
    this.moduleParam = this.getFunctionParam(paramMappings.module);
    this.exportsParam = this.getFunctionParam(paramMappings.exports);
  }

  private getFunctionParam(index?: number): Identifier | undefined {
    if (index == null) return undefined;
    const param = this.rootPath.get('params')[index];
    if (!param || !param.isIdentifier()) return undefined;
    return param.node;
  }

  calculateFields(): void {
    this.originalCode = generator({
      ...this.originalFile.program,
      type: 'Program',
      body: [expressionStatement(this.rootPath.node)],
    }, { compact: true }).code;

    this.rootPath.traverse({
      StringLiteral: (path) => {
        this.moduleStrings.push(path.node.value);
      },
      Identifier: (path) => {
        if (path.node.name.length > 1) {
          this.variableNames.add(path.node.name);
        }
      },
    });

    this.moduleComments = this.originalFile.comments
      ?.filter((comment) => this.rootPath.node.start && this.rootPath.node.end && comment.start > this.rootPath.node.start && comment.end < this.rootPath.node.end)
      ?.map((comment) => comment.value) || [];
  }

  validate(): void {
    if (!this.originalCode) throw new Error('Original code is required');
    if (!this.moduleStrings) throw new Error('Module strings is required');
    if (!this.moduleComments) throw new Error('Module comments is required');
  }

  unpack(): void {
    if (this.globalsParam?.name) {
      this.rootPath.scope.rename(this.globalsParam?.name, 'globals');
    }
    if (this.requireParam?.name) {
      this.rootPath.scope.rename(this.requireParam?.name, 'require');
    }
    if (this.moduleParam?.name) {
      this.rootPath.scope.rename(this.moduleParam?.name, 'module');
    }
    if (this.exportsParam?.name) {
      this.rootPath.scope.rename(this.exportsParam?.name, 'exports');
    }
  }

  toCache(): CachedModule {
    return {
      code: this.originalCode,
      dependencies: this.dependencies,
      originalDependencies: this.originalDependencies,
      ignored: this.ignored,
      isNpmModule: this.isNpmModule,
      isPolyfill: this.isPolyfill,
      isStatic: this.isStatic,
      staticContent: this.staticContent,
      moduleId: this.moduleId,
      moduleName: this.moduleName,
      moduleStrings: this.moduleStrings,
      moduleComments: this.moduleComments,
      variableNames: [...this.variableNames],
      paramMappings: this.paramMappings,
      npmModuleVarName: this.npmModuleVarName,
      previousRunChecksum: crypto.createHash('md5').update(JSON.stringify(this.moduleCode.body)).digest('hex'),
    };
  }

  debugToCode(): string {
    return generator({
      ...this.originalFile.program,
      type: 'Program',
      body: this.moduleCode.body,
    }).code;
  }
}

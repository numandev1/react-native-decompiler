

import { Visitor, NodePath } from '@babel/traverse';
import {
  VariableDeclarator,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isNumericLiteral,
  arrayPattern,
  identifier,
  Identifier,
} from '@babel/types';
import { Plugin } from '../../plugin';
import Module from '../../module';
import CmdArgs from '../../interfaces/cmdArgs';

interface VariableDeclaratorData {
  path: NodePath<VariableDeclarator>;
  varName: string;
  varStart: number;
  couldBeDestructure: boolean;
  destructureBindingStart?: number;
  destructureArrayBindingStart?: number;
  couldBeArrayAccess: boolean;
  arrayAccessBindingStart?: number;
  arrayAccessVal?: number;
}

/**
 * Converts Babel array destructuring to the native one
 */
export default class ArrayDestructureEvaluator extends Plugin {
  readonly pass = 2;

  private readonly destructureUsed: boolean;
  private readonly variableDeclarators: VariableDeclaratorData[] = [];
  private destructureFunction?: NodePath<VariableDeclarator>;
  private destructureFunctionStart?: number;

  constructor(args: CmdArgs, module: Module, moduleList: Module[]) {
    super(args, module, moduleList);

    const destructureDependency = moduleList.find((mod) => mod?.moduleName === '@babel/runtime/helpers/slicedToArray');
    this.destructureUsed = destructureDependency?.moduleId != null && module.dependencies.includes(destructureDependency?.moduleId);
  }

  getVisitor(): Visitor {
    if (!this.destructureUsed) return {};

    return {
      VariableDeclarator: (path) => {
        if (!isIdentifier(path.node.id) || path.node.id.start == null) return;

        const variableDeclaratorData: VariableDeclaratorData = {
          path,
          couldBeDestructure: false,
          couldBeArrayAccess: false,
          varName: path.node.id.name,
          varStart: path.node.id.start,
        };

        if (isCallExpression(path.node.init) && isIdentifier(path.node.init.callee)
          && path.node.init.arguments.length === 2 && isIdentifier(path.node.init.arguments[0]) && isNumericLiteral(path.node.init.arguments[1])) {
          variableDeclaratorData.couldBeDestructure = true;
          variableDeclaratorData.destructureBindingStart = path.scope.getBindingIdentifier(path.node.init.callee.name)?.start ?? undefined;
          variableDeclaratorData.destructureArrayBindingStart = path.scope.getBindingIdentifier(path.node.init.arguments[0].name)?.start ?? undefined;
        }
        if (isMemberExpression(path.node.init) && isIdentifier(path.node.init.object) && isNumericLiteral(path.node.init.property)) {
          variableDeclaratorData.couldBeArrayAccess = true;
          variableDeclaratorData.arrayAccessBindingStart = path.scope.getBindingIdentifier(path.node.init.object.name)?.start ?? undefined;
          variableDeclaratorData.arrayAccessVal = path.node.init.property.value;
        }

        this.variableDeclarators.push(variableDeclaratorData);

        const callExpression = path.get('init');
        if (!callExpression.isCallExpression()) return;

        const moduleDependency = this.getModuleDependency(callExpression);
        if (moduleDependency?.moduleName === '@babel/runtime/helpers/slicedToArray') {
          this.destructureFunction = path;
          this.destructureFunctionStart = path.node.id.start;
        }
      },
    };
  }

  afterPass(): void {
    if (this.destructureFunctionStart == null) return;

    this.variableDeclarators.forEach((data) => {
      if (!data.couldBeDestructure) return;
      if (data.destructureBindingStart !== this.destructureFunctionStart) return;

      const sourceArray = this.variableDeclarators.find((srcData) => srcData.varStart === data.destructureArrayBindingStart);
      const arrayUsages = this.variableDeclarators.filter((arrData) => arrData.arrayAccessBindingStart === data.varStart);
      if (!sourceArray || !arrayUsages.length) return;

      const arrayPatternElements: (Identifier | null)[] = [];
      arrayUsages.forEach((usage) => {
        if (usage.arrayAccessVal == null) throw new Error();
        arrayPatternElements[usage.arrayAccessVal] = identifier(usage.varName);
      });
      for (let i = 0; i < arrayPatternElements.length; i += 1) {
        if (arrayPatternElements[i] === undefined) {
          arrayPatternElements[i] = null;
        }
      }

      sourceArray.path.node.id = arrayPattern(arrayPatternElements);

      if (!this.destructureFunction?.removed) {
        this.destructureFunction?.remove();
      }
      if (!data.path.removed) {
        data.path.remove();
      }
      arrayUsages.forEach((usageData) => (usageData.path.removed ? null : usageData.path.remove()));
    });
  }
}

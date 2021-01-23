

import { Visitor } from '@babel/traverse';
import {
  isMemberExpression,
  isIdentifier,
  jsxElement,
  isObjectProperty,
  isStringLiteral,
  jsxAttribute,
  jsxIdentifier,
  isBooleanLiteral,
  jsxExpressionContainer,
  isExpression,
  JSXAttribute,
  jsxOpeningElement,
  jsxMemberExpression,
  JSXIdentifier,
  JSXMemberExpression,
  isObjectExpression,
  JSXElement,
  isCallExpression,
  jsxClosingElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXSpreadChild,
  JSXText,
  Expression,
  jsxText,
} from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts React.createElement to JSX
 */
export default class JSXConverter extends Plugin {
  readonly pass = 3;
  name = 'JSXConverter';

  getVisitor(): Visitor {
    return {
      CallExpression: (path) => {
        if (!isMemberExpression(path.node.callee) || !isIdentifier(path.node.callee.object) || !isIdentifier(path.node.callee.property)) return;
        if (path.node.callee.object.name !== 'React' || path.node.callee.property.name !== 'createElement') return;

        path.replaceWith(this.parseJsx(path.node));
        this.module.tags.push('jsx');
      },
    };
  }

  private parseJsx(node: Expression): JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment {
    if (isStringLiteral(node)) {
      return jsxText(node.value);
    }
    if (isCallExpression(node)) {
      const args = node.arguments;

      let name: JSXIdentifier | JSXMemberExpression | undefined;
      if (isIdentifier(args[0]) || isStringLiteral(args[0])) {
        name = jsxIdentifier(isIdentifier(args[0]) ? args[0].name : args[0].value);
      } else if (isMemberExpression(args[0]) && isIdentifier(args[0].object) && isIdentifier(args[0].property)) {
        name = jsxMemberExpression(jsxIdentifier(args[0].object.name), jsxIdentifier(args[0].property.name));
      } else {
        this.debugLog(`fail to parse component ${args[0].type} inside callExpression`);
        return jsxExpressionContainer(node);
      }

      let props: JSXAttribute[] = [];
      if (isObjectExpression(args[1])) {
        props = args[1].properties.map((prop) => {
          if (!isObjectProperty(prop) || !isIdentifier(prop.key)) return null;
          if (isStringLiteral(prop.value)) {
            return jsxAttribute(jsxIdentifier(prop.key.name), prop.value);
          }
          if (isBooleanLiteral(prop.value) && prop.value.value) {
            return jsxAttribute(jsxIdentifier(prop.key.name), null);
          }
          if (isExpression(prop.value)) {
            return jsxAttribute(jsxIdentifier(prop.key.name), jsxExpressionContainer(prop.value));
          }
          return null;
        }).filter((e): e is JSXAttribute => e != null);
      }

      const children = args.slice(2).map((e) => (isExpression(e) ? this.parseJsx(e) : null)).filter((e): e is JSXElement => e != null);

      if (children.length) {
        return jsxElement(jsxOpeningElement(name, props), jsxClosingElement(name), children);
      }

      return jsxElement(jsxOpeningElement(name, props, true), null, []);
    }

    this.debugLog(`fail to parse component ${node.type}`);
    return jsxExpressionContainer(node);
  }
}

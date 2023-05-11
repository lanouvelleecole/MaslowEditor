import { parseScript } from "esprima";

export function RemoveExportFromFunction(code: string): string {
  let codeTrimmed = code.trim();

  if (codeTrimmed.startsWith("export ")) {
    codeTrimmed = codeTrimmed.replace("export ", "");
    codeTrimmed = codeTrimmed.trim();
  }

  return codeTrimmed;
}

export function IsFunctionExported(code: string): boolean {
  let codeTrimmed = code.trim();

  return codeTrimmed.startsWith("export ");
}

export function GetVariablesUsedInCode(
  code: string,
  variables: string[]
): string[] {
  const usedVariables = new Set();

  const codeTrimmed = RemoveExportFromFunction(code);

  const codeWrap = `
(function() {
  ${codeTrimmed}
})();`;
  const ast = parseScript(codeWrap);

  function traverse(node: any) {
    if (node.type === "Identifier" && variables.includes(node.name)) {
      usedVariables.add(node.name);
    } else {
      Object.values(node).forEach((value) => {
        if (value && typeof value === "object") {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === "object") {
                traverse(item);
              }
            });
          } else {
            traverse(value);
          }
        }
      });
    }
  }

  traverse(ast);

  return [...usedVariables] as string[];
}

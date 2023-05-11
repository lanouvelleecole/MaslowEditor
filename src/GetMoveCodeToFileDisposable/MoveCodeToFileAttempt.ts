import * as path from "path";
import * as fs from "fs";
import * as esprima from "esprima";
import * as prettier from "prettier";
import { GetImportsFromCode } from "./GetImportsFromCode";
import { GetGlobalVariablesFromCode } from "./GetVariablesFromCode";
import { GetLocalVariablesFromCode } from "./GetLocalVariablesFromCode";
import { GetVariablesUsedInCode } from "./GetVariablesUsedInCode";
import { GetGlobalFunctionsNames } from "../GetGlobalFunctions/GetGlobalFunctions";
import { getPathWithForwardSlashes } from "../GetPathWithForwardSlashes/getPathWithForwardSlashes";

function getDependencies(code: string, filePath: string): string[] {
  const dependencies: string[] = [];

  const ast = esprima.parseModule(code);

  ast.body.forEach((node: any) => {
    if (node.type === "ImportDeclaration") {
      dependencies.push(node.source.value);
    }
  });

  return dependencies.map((dep) => path.resolve(path.dirname(filePath), dep));
}

export function MoveCodeToFileAttempt(
  pieceOfCode: string,
  originPath: string,
  destPath: string,
  functionName: string
): string | null {
  try {
    // Create any missing directories in destPath
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    const globalFunctionsNames = GetGlobalFunctionsNames(originPath);

    const globalVariablesUsed = GetGlobalVariablesFromCode(originPath);

    const localVariablesUsed = GetLocalVariablesFromCode(
      originPath,
      pieceOfCode
    );
    const actualVariablesUsed = GetVariablesUsedInCode(pieceOfCode, [
      ...globalVariablesUsed,
      ...localVariablesUsed,
    ]).join(", ");

    const actualFunctionsUsedImports = GetVariablesUsedInCode(
      pieceOfCode,
      globalFunctionsNames
    );

    // Replace the code in the destination file
    const destContent = `

/**
 * 
 * args: ${actualVariablesUsed ?? ""}
 * 
 * return .....
 * 
 * This function .......
 */ 
function ${functionName}(${actualVariablesUsed}) {
  ${pieceOfCode}
}

export { ${functionName} }
`;

    // Use prettier to format the output string
    const formattedDestContent = prettier.format(destContent, {
      parser: "babel",
      filepath: destPath,
    });

    fs.writeFileSync(destPath, formattedDestContent);

    return fs.readFileSync(destPath, "utf-8");
  } catch (err) {
    console.error(err);
    return null;
  }
}

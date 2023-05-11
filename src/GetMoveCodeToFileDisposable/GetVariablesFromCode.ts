import * as fs from "fs";
import { GetGlobalFunctionsNames } from "../GetGlobalFunctions/GetGlobalFunctions";

function GetGlobalVariablesFromCode(filePath: string): string[] {
  const code = fs.readFileSync(filePath, "utf8");

  // Use a regular expression to match global variable declarations
  const regex =
    /\r?\n(?:export\s+)?(?:var|let|const)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g;

  const globalVars: string[] = [];

  let match;
  while ((match = regex.exec(code)) !== null) {
    globalVars.push(match[1]);
  }

  const globalFunctions = GetGlobalFunctionsNames(filePath);

  return globalVars.filter((varName) => !globalFunctions.includes(varName));
}

export { GetGlobalVariablesFromCode };

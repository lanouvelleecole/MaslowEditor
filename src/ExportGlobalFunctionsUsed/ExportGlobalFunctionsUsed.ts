import * as vscode from "vscode";
import * as fs from "fs";
import * as prettier from "prettier";
import { GetGlobalFunctionsNames } from "../GetGlobalFunctions/GetGlobalFunctions";
import { GetGlobalVariablesFromCode } from "../GetMoveCodeToFileDisposable/GetVariablesFromCode";
import { GetGlobalJSFunctionsFromFile } from "../services/GetGlobalJSFunctions/GetGlobalJSFunctions";

function ExportGlobalFunctionsUsed(
  filePath: string,
  exportedFuncNames: string[]
): void {
  const sourceCode = fs.readFileSync(filePath, "utf8");
  let modifiedCode = sourceCode;

  const globalFunctions = GetGlobalJSFunctionsFromFile(filePath);
  const globalFunctionNames = GetGlobalFunctionsNames(filePath);

  //let basket: string[] = [];

  //vscode.window.showInformationMessage(`glo funcs: ${globalFunctions}`);

  globalFunctions.forEach((func, index) => {
    const funcName = globalFunctionNames[index];
    const funcTrimmed = func.trim();

    // Use a regular expression to match global variable declarations
    const regex = new RegExp(`\r?\n(export)\s+(var|let|const)\s+(${funcName})`);

    const globalVars: string[] = [];

    let match = regex.exec(sourceCode) !== null;

    // Check if the function is already exported
    if (match) {
      // Do nothing
    } else if (exportedFuncNames.includes(funcName)) {
      //vscode.window.showInformationMessage(`func trimmed: ${funcTrimmed}`);

      const funcTrimExported = `export ${funcTrimmed}`;
      modifiedCode = modifiedCode.replace(funcTrimmed, funcTrimExported);
    }
  });

  //const formattedCode = prettier.format(modifiedCode, { filepath: filePath });
  fs.writeFileSync(filePath, modifiedCode, "utf8");

  //return basket;
}

function ExportGlobalVariablesUsed(
  filePath: string,
  exportedVarsNames: string[]
): void {
  // le code source du fichier filePath
  let sourceCode = fs.readFileSync(filePath, "utf8");

  // les variables globales présentes dans filePath
  const globalVariables = GetGlobalVariablesFromCode(filePath);

  // pour chaque variable globale de filePath...
  globalVariables.forEach((varName, index) => {
    const varRegex = sourceCode.match(
      // Use a regular expression to match global variable declarations
      new RegExp(`\r?\n(var|let|const)\s+(${varName})`)
    );

    // Check if variable is already exported
    const exportedVarRegex = sourceCode.match(
      new RegExp(`\r?\n(export)\s+(var|let|const)\s+(${varName})`)
    );

    if (!exportedVarRegex) {
      // If variable is not already exported, add the 'export' keyword before the declaration
      const varRegex = new RegExp(`(var|let|const)\s+${varName}`);
      sourceCode = sourceCode.replace(varRegex, `export $1 ${varName}`);
    }
  });

  const formattedCode = prettier.format(sourceCode, { filepath: filePath });
  fs.writeFileSync(filePath, formattedCode, "utf8");
}

export { ExportGlobalFunctionsUsed, ExportGlobalVariablesUsed };

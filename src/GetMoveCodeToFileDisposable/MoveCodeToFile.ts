import * as vscode from "vscode";
import * as prettier from "prettier";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { GetImportsFromCode } from "./GetImportsFromCode";
import { GetGlobalVariablesFromCode } from "./GetVariablesFromCode";
import { GetLocalVariablesFromCode } from "./GetLocalVariablesFromCode";
import { GetVariablesUsedInCode } from "./GetVariablesUsedInCode";
import * as escodegen from "escodegen";
import { GetGlobalFunctionsNames } from "../GetGlobalFunctions/GetGlobalFunctions.js";
import { ExportGlobalFunctionsUsed } from "../ExportGlobalFunctionsUsed/ExportGlobalFunctionsUsed";
import { MoveCodePieceToFunction } from "./MoveCodePieceToFunction";
import { MoveFunctionToFile } from "./MoveFunctionToFile";
import {
  GetGlobalJSFunctionsFromSource,
  GetJSFunctionsFromSource,
} from "../services/GetGlobalJSFunctions/GetGlobalJSFunctions";

export async function MoveCodeToFile() {
  const vscode_instance = vscode;
  const vscode_window = vscode_instance.window;

  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage("No active text editor.");
    return;
  }

  const selectedText = editor.document.getText(editor.selection);

  if (!selectedText) {
    vscode.window.showErrorMessage("No code selected.");
    return;
  }

  await vscode.env.clipboard.writeText(selectedText);
  let clipboardText = await vscode.env.clipboard.readText();

  if (!clipboardText) {
    vscode.window.showErrorMessage("Clipboard is empty.");
    return;
  }

  const functionName = await vscode.window.showInputBox({
    prompt: "Write the name of the function:",
  });

  if (!functionName) {
    vscode.window.showErrorMessage("Invalid function name.");
    return;
  }

  const fileUri = editor.document.uri;
  const tabPath = fileUri.fsPath;

  const fileExtension = path.extname(tabPath);
  const fileName = path.basename(fileUri.fsPath, fileExtension);
  const parentFolder = path.dirname(fileUri.fsPath);
  const defaultFilePath = path.join(
    parentFolder,
    "pieces",
    functionName,
    `${functionName}${fileExtension}`
  );

  const globalFunctionsNames = GetGlobalFunctionsNames(tabPath);
  const actualFunctionsUsed: any = GetVariablesUsedInCode(
    clipboardText,
    globalFunctionsNames
  );
  const relatedImports = GetImportsFromCode(
    clipboardText,
    tabPath,
    functionName
  );
  const allGlobalVariables = GetGlobalVariablesFromCode(tabPath);
  const allLocalVariables = GetLocalVariablesFromCode(tabPath, clipboardText);

  const actualVariablesUsed = GetVariablesUsedInCode(clipboardText, [
    ...allGlobalVariables,
    ...allLocalVariables,
  ]).join(", ");

  const clipboardFunctions = GetJSFunctionsFromSource(clipboardText);

  const IsCodePieceIndented: any = IsCodeIndented(clipboardText, tabPath);

  vscode.window.showInformationMessage(
    `
Here's the imports related to the highlighted code:

${relatedImports}

Here's all the global constants/variables reachable by the code:

${allGlobalVariables}

Here's all the local constants/variables reachable by the code: 

${allLocalVariables}

Here's the constants/variables 
related to the highlighted code:

${actualVariablesUsed}

Is the code indented ?: 

${IsCodePieceIndented}
`
  );

  const filePath = await vscode.window.showInputBox({
    prompt: "Where do you want to create this function:",
    value: defaultFilePath,
  });
  if (!filePath) {
    vscode.window.showErrorMessage("Invalid function path.");
    return;
  }

  const highlightContainsFunctions = clipboardFunctions?.length > 0;

  // crée un fichier avec une fonction dedans
  if (IsCodePieceIndented) {
    await MoveCodePieceToFunction(
      clipboardText,
      tabPath,
      filePath,
      functionName,
      actualVariablesUsed
    );
  } else {
    await MoveFunctionToFile(
      clipboardText,
      tabPath,
      filePath,
      functionName,
      actualVariablesUsed
    );
  }
}

export function OpenFileInNewTab(filePath: string): void {
  // Get the URI for the file path
  const uri = vscode.Uri.file(filePath);

  // Open the file in a new tab
  vscode.window.showTextDocument(uri, { preview: false });
}

export function ReplaceCodeInFileWith(
  code: string,
  filePath: string,
  replacement: string
) {
  // Read the contents of the file
  const contents = fs.readFileSync(filePath, "utf8");

  // Replace the code with the replacement string
  const updatedContents = contents.replace(code, replacement);

  // Format the updated contents with prettier
  const formattedContents = prettier.format(updatedContents, {
    parser: "typescript",
  });

  // Write the formatted contents back to the file
  fs.writeFileSync(filePath, formattedContents, "utf8");
}

export function IsCodeIndented(codePiece: string, filePath: string) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const trimmedCodePiece = codePiece.trim();
  const index = fileContent.indexOf(trimmedCodePiece);

  if (index < 1) {
    return null;
  }

  const charBeforeIndex = fileContent.charAt(index - 1);

  if (charBeforeIndex === "\n") {
    return false;
  }

  if (/\s/.test(charBeforeIndex)) {
    return true;
  }

  return false;
}

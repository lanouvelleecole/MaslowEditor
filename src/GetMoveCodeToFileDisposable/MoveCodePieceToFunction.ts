import * as vscode from "vscode";
import * as path from "path";
import { GetImportsFromCode } from "./GetImportsFromCode";
import { GetVariablesUsedInCode } from "./GetVariablesUsedInCode";
import { MoveCodeToFileAttempt } from "./MoveCodeToFileAttempt";
import { InjectStuffUnderPatterns } from "../InjectStuffUnderPatterns/InjectStuffUnderPatterns.js";
import { getPathWithForwardSlashes } from "../GetPathWithForwardSlashes/getPathWithForwardSlashes.js";
import {
  AddDotAndSlashToPath,
  RecalibrateFileImports,
} from "../RecalibrateFileImports/RecalibrateFileImports.js";
import { GetGlobalFunctionsNames } from "../GetGlobalFunctions/GetGlobalFunctions.js";
import { ExportGlobalFunctionsUsed } from "../ExportGlobalFunctionsUsed/ExportGlobalFunctionsUsed";
import { OpenFileInNewTab, ReplaceCodeInFileWith } from "./MoveCodeToFile";
import { IsRelativePath } from "../IsRelativePath/IsRelativePath";
import { RemoveExtension } from "../RemoveExtension/RemoveExtension";
import { ReplaceImportInFiles } from "../ReplaceAllImportsEverywhere/ReplaceAllImportsEverywhere";

export async function MoveCodePieceToFunction(
  clipboardText: string,
  tabPath: string,
  filePath: string,
  functionName: string,
  actualVariablesUsed: string
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) return;

  const appRootPath = workspaceFolders[0].uri.fsPath;

  // crée le fichier, originaire de tabPath, vers l'emplacement souhaité, spécifié par filePath.
  // avec la fonction désirée dedans
  MoveCodeToFileAttempt(clipboardText, tabPath, filePath, functionName);

  // ajoute le ou les import(s) de cette fonction, dans tabPath, l'emplacement d'origine d'ou vient le code déplacé
  let funcRelativePath = getPathWithForwardSlashes(
    path.relative(path.dirname(tabPath), filePath)
  );

  funcRelativePath = AddDotAndSlashToPath(funcRelativePath);

  InjectStuffUnderPatterns(tabPath, [
    {
      addOnTop: true,
      stuffUnderPattern: `import { ${functionName} } from "${RemoveExtension(
        funcRelativePath
      )}";`,
      deletePreviousIdenticalLine: true,
      indent: false,
    },
  ]);

  // le ou les import(s) des dépendances liées a cette fonction
  const relatedImports =
    GetImportsFromCode(clipboardText, tabPath, functionName).join("\n") + "\n";

  // le ou les noms des fonctions globales du fichier d'ou vient le code de cette fonction
  const globalFunctionsNames = GetGlobalFunctionsNames(tabPath);

  // les noms des fonctions globales qu'utilisent le code de cette fonction
  const actualFunctionsUsed: any = GetVariablesUsedInCode(
    clipboardText,
    globalFunctionsNames
  );

  /*vscode.window.showInformationMessage(
    `global functions names: ${globalFunctionsNames}`
  );*/

  // le ou les import(s) des fonctions globales liées a cette fonction
  const globalFunctionImports = actualFunctionsUsed
    .map((funcName: any) => {
      return `import { ${funcName} } from "${`./${RemoveExtension(
        path.basename(tabPath)
      )}`}";`;
    })
    .join("\n");

  InjectStuffUnderPatterns(filePath, [
    // les imports de dépendence externes a tabPath, lies a ce code bougé
    {
      addOnTop: true,
      stuffUnderPattern: relatedImports,
      deletePreviousStuff: true,
      indent: false,
    },
    // les imports de dépendence internes (fonction de tabPath, lies a ce code bougé)
    {
      addOnTop: true,
      stuffUnderPattern: globalFunctionImports,
      deletePreviousStuff: true,
      indent: false,
    },
  ]);

  // repositionne les import relatifs de cette fonction déplacée de tabPath vers filePath.
  // les imports provenant de tabPath, liés à cette fonction, injectés tt juste avant,
  // doivent être recalculés ici
  RecalibrateFileImports(tabPath, filePath);

  // Remplace les imports de ce fichier
  // par le nouvel emplacement relatif a sa position actuelle
  // dans tous les fichiers .js / .ts du dossier ouvert dans vscode
  // (AKA APP ROOT)
  //ReplaceImportInFiles(appRootPath, functionName, tabPath, filePath);

  // remplace le highlight par un call de fonction créee
  ReplaceCodeInFileWith(
    clipboardText.trim(),
    tabPath,
    `${functionName}(${actualVariablesUsed})`
  );

  // ouvre le fichier tout juste crée dans vscode
  OpenFileInNewTab(filePath);

  // rend les fonctions de tabPath, utilisées dans filePath, exportées, si pas déja exportées
  //ExportGlobalFunctionsUsed(tabPath, actualFunctionsUsed);
}

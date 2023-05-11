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
import {
  GetJSFunctionsBodiesFromSample,
  GetGlobalFunctionsNames,
  GetJSFunctionsNamesFromSample,
} from "../GetGlobalFunctions/GetGlobalFunctions.js";
import {
  ExportGlobalFunctionsUsed,
  ExportGlobalVariablesUsed,
} from "../ExportGlobalFunctionsUsed/ExportGlobalFunctionsUsed";
import { OpenFileInNewTab, ReplaceCodeInFileWith } from "./MoveCodeToFile";
import { MoveFunctionToFileAttempt } from "./MoveFunctionToFileAttempt";
import { GetGlobalVariablesFromCode } from "./GetVariablesFromCode";
import { removeDuplicatesFromArray } from "./removeDuplicatesFromArray";
import { IsRelativePath } from "../IsRelativePath/IsRelativePath";
import { RemoveExtension } from "../RemoveExtension/RemoveExtension";
import { ReplaceImportInFiles } from "../ReplaceAllImportsEverywhere/ReplaceAllImportsEverywhere";
import {
  GetGlobalJSFunctionsFromSource,
  GetJSFunctionsFromSource,
} from "../services/GetGlobalJSFunctions/GetGlobalJSFunctions";

export async function MoveFunctionToFile(
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
  MoveFunctionToFileAttempt(clipboardText, tabPath, filePath, functionName);

  // ajoute le ou les import(s) de cette fonction, dans tabPath, l'emplacement d'origine d'ou vient le code déplacé
  InjectStuffUnderPatterns(
    tabPath,
    getInjectsForFunctions(functionName, tabPath, filePath, clipboardText)
  );

  // ajoute, dans filePath (le fichier de la fonction tt juste créee)
  // le ou les import(s) des dépendances/fonctions liées a cette fonction
  // originellement dans le tab vscode, puis extrait de ce tab, et ré-injecté maintenant,
  // dans le fichier de la fonction tt juste créee.
  // the important shyt
  const {
    relatedImportsUsedStr,
    globalFunctionImportsStr,
    relatedIndentifiersUsed,
  } = GetMovedFunctionsBaggage(clipboardText, tabPath);

  InjectStuffUnderPatterns(filePath, [
    // les imports de dépendence externes a tabPath, lies a ce code bougé
    {
      addOnTop: true,
      stuffUnderPattern: relatedImportsUsedStr,
      deletePreviousStuff: true,
      indent: false,
    },
    // les imports de dépendence internes (fonction de tabPath, lies a ce code bougé)
    {
      addOnTop: true,
      stuffUnderPattern: globalFunctionImportsStr,
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
  const functionNames = GetJSFunctionsNamesFromSample(clipboardText);

  await ReplaceImportInFiles(appRootPath, functionNames, tabPath, filePath);

  // ouvre le fichier tout juste crée dans vscode
  OpenFileInNewTab(filePath);

  // remplace le highlight par un call de fonction créee
  ReplaceCodeInFileWith(clipboardText.trim(), tabPath, ``);

  // rend les fonctions globales de tabPath, utilisées dans filePath, exportées, si pas déja exportées
  //ExportGlobalFunctionsUsed(tabPath, relatedIndentifiersUsed);

  // rend les variables globales de tabPath, utilisées dans filePath, exportées, si pas déja exportées
  //ExportGlobalVariablesUsed(tabPath, relatedIndentifiersUsed);
}

function GetMovedFunctionsBaggage(clipboardText: string, tabPath: string) {
  // les fonctions globales du fichier d'origine des fonctions
  // potentiellement necessaires
  const globalFunctionsNames: any = GetGlobalFunctionsNames(tabPath);

  // les variables globales du fichier d'origine des fonctions
  // potentiellement necessaires
  const globalVarNames: any = GetGlobalVariablesFromCode(tabPath);

  // les bodies des fonctions clipboardées
  const functionsBodies: string[] =
    GetJSFunctionsBodiesFromSample(clipboardText);

  // les imports liés au body de l'une des functions clipboardés
  let relatedImportsUsed: string[] | string = [];

  // les noms des fonctions utilisées dans le body d'une des fonctions clipboardées
  let relatedIndentifiersUsed: string[] = [];

  // pour chaque body de function clipboardé....
  functionsBodies.forEach((funcBody, index) => {
    // le nom de la fonction
    const functionName = globalFunctionsNames[index];

    // stocke les identifieurs de variables/fonctions globales,
    // utilisées par le body d'une des fonctions déménageuses
    relatedIndentifiersUsed = [
      ...relatedIndentifiersUsed,
      ...GetVariablesUsedInCode(funcBody, [
        ...globalFunctionsNames,
        ...globalVarNames,
      ]),
    ];

    // stocke les identifieurs d'imports,
    // utilisées par le body d'une des fonctions déménageuses
    relatedImportsUsed = [
      ...relatedImportsUsed,
      ...GetImportsFromCode(funcBody, tabPath, functionName),
    ];
  });

  //vscode.window.showInformationMessage(`ids: ${globalVarNames}`);

  // une fois collecté les usages, on filtre les imports et identifiers utilisés,
  // pour enlever les duplicatas
  relatedImportsUsed = removeDuplicatesFromArray(relatedImportsUsed);
  relatedIndentifiersUsed = removeDuplicatesFromArray(relatedIndentifiersUsed);

  // maintenant on prépare les imports version string,
  // de fonctions globaales utilisées par les fonctions migratrices,
  // qui seront ajoutés au fichier de destination des fonctions
  const globalFunctionImportsStr: string = relatedIndentifiersUsed
    .map((funcName: any) => {
      return `import { ${funcName} } from "${`./${RemoveExtension(
        path.basename(tabPath)
      )}`}";`;
    })
    .join("\n");

  // maintenant on prépare les imports version string,
  // de imports liés aux fonctions migratrices,
  // qui seront ajoutés au fichier de destination des fonctions
  const relatedImportsUsedStr: string = relatedImportsUsed.join("\n");

  return {
    relatedIndentifiersUsed,
    relatedImportsUsedStr,
    globalFunctionImportsStr,
  };
}

export function getInjectsForFunctions(
  functionName: string,
  tabPath: string,
  filePath: string,
  clipboardText: string
): any {
  const clipboardFunctions = GetJSFunctionsFromSource(clipboardText);
  const clipFuncNames = GetJSFunctionsNamesFromSample(clipboardText);

  const injects = clipboardFunctions.map((func, index) => {
    const funcName = clipFuncNames[index];

    let funcRelativePath = getPathWithForwardSlashes(
      path.relative(path.dirname(tabPath), filePath)
    );

    funcRelativePath = AddDotAndSlashToPath(funcRelativePath);

    return {
      addOnTop: true,
      stuffUnderPattern: `import { ${funcName} } from "${RemoveExtension(
        funcRelativePath
      )}";`,
      deletePreviousIdenticalLine: true,
      indent: false,
    };
  });

  return injects;
}

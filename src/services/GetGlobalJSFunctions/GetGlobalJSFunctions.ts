/* PLOP_INJECT_IMPORT */

/* PLOP_INJECT_GLOBAL_CODE */

// Import libraries
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as util from "util";
import { RemoveExportFromFunction } from "../../GetMoveCodeToFileDisposable/GetVariablesUsedInCode";
import { IsCodeIndented } from "../../GetMoveCodeToFileDisposable/MoveCodeToFile";

/**
 *Returns a list of strings, the list of global JS/TS functions found in the source code of filePath
 */
function GetGlobalJSFunctionsFromFile(filePath: string) {
  let source = fs.readFileSync(filePath).toString();

  return GetGlobalJSFunctionsNoArrow(source)
    .concat(GetGlobalJSFunctionsArrow(source))
    .filter((func) => !IsCodeIndented(func, filePath))
    .map((func) => RemoveExportFromFunction(func));
}

function GetGlobalJSFunctionsFromSource(source: string) {
  return GetGlobalJSFunctionsNoArrow(source)
    .concat(GetGlobalJSFunctionsArrow(source))
    .map((func) => RemoveExportFromFunction(func));
}

function GetJSFunctionsFromSource(source: string) {
  const jsFuncsNoArrow = GetJSFunctionsNoArrow(source);
  const jsFuncsArrow = GetJSFunctionsArrow(source);

  return jsFuncsNoArrow
    .concat(jsFuncsArrow)
    .map((func) => RemoveExportFromFunction(func));
}

function GetGlobalJSFunctionsNoArrow(source: string) {
  let latestFuncIndex = 0;
  let found = true;
  let basket: string[] = [];

  while (found) {
    source = source.substring(latestFuncIndex);

    // Extract function name with a regex
    let funcRegex = new RegExp(
      `(?:\\n)(?:(?:export )?(?:async )?)function (\\w+)\\(`,
      "m"
    );
    let match = funcRegex.exec(source);
    if (!match) {
      found = false;
    }

    if (found) {
      let funcName = match?.at(1);
      let startIndex = match?.index;
      let endIndex = source.indexOf(`\n}`, startIndex);

      //Fix
      if (startIndex != null && endIndex > startIndex) {
        endIndex += 3;
      }

      // Store found string in basket
      startIndex != null
        ? basket.push(source.substring(startIndex, endIndex + 3))
        : 42;

      // Update index position
      latestFuncIndex = endIndex;
    }
  }
  return basket;
}

function GetGlobalJSFunctionsArrow(source: string) {
  let latestFuncIndex = 0;
  let found = true;
  let basket: string[] = [];

  while (found) {
    source = source.substring(latestFuncIndex);

    // Extract arrow function name with another, separate, regex
    let arrowFuncRegex = new RegExp(
      `(?:\\n)(?:(?:export )?(?:const|let|var))\\s*(\\w+)\\s*=\\s*(?:async )?\\([^)]*\\)\\s*=>`,
      "m"
    );

    let match = arrowFuncRegex.exec(source);
    if (!match) {
      found = false;
    }

    if (found) {
      let startIndex = match?.index;
      let endIndex = source.indexOf(`\n}`, startIndex);

      //Fix
      if (startIndex != null && endIndex > startIndex) {
        endIndex += 3;
      }

      // Store found string in basket
      startIndex != null
        ? basket.push(source.substring(startIndex, endIndex + 3))
        : 42;

      // Update index position
      latestFuncIndex = endIndex;
    }
  }
  return basket;
}

function GetJSFunctionsNoArrow(source: string) {
  let latestFuncIndex = 0;
  let found = true;
  let basket: string[] = [];

  while (found) {
    source = source.substring(latestFuncIndex);

    // Extract function name with a regex
    let funcRegex = new RegExp(
      `(?:(?:export )?(?:async )?function) (\\w+)\\(`,
      "m"
    );
    let match = funcRegex.exec(source);
    if (!match) {
      found = false;
    }

    if (found) {
      let startIndex = match?.index;
      let endIndex = source.indexOf(`\n}`, startIndex);

      //Fix
      if (startIndex != null && endIndex > startIndex) {
        endIndex += 3;
      }

      // Store found string in basket
      startIndex != null
        ? basket.push(source.substring(startIndex, endIndex + 3))
        : 42;

      // Update index position
      latestFuncIndex = endIndex;
    }
  }
  return basket;
}

function GetJSFunctionsArrow(source: string) {
  let latestFuncIndex = 0;
  let found = true;
  let basket: string[] = [];

  while (found) {
    source = source.substring(latestFuncIndex);

    // Extract arrow function name with another, separate, regex
    let arrowFuncRegex = new RegExp(
      `(?:(?:export )?(?:const|let|var))\\s*(\\w+)\\s*=\\s*(?:async )?\\([^)]*\\)\\s*=>`,
      "m"
    );

    let match = arrowFuncRegex.exec(source);
    if (!match) {
      found = false;
    }

    if (found) {
      let startIndex = match?.index;
      let endIndex = source.indexOf(`\n}`, startIndex);

      //Fix
      if (startIndex != null && endIndex > startIndex) {
        endIndex += 3;
      }

      // Store found string in basket
      startIndex != null
        ? basket.push(source.substring(startIndex, endIndex + 3))
        : 42;

      // Update index position
      latestFuncIndex = endIndex;
    }
  }
  return basket;
}

export {
  GetGlobalJSFunctionsFromFile,
  GetGlobalJSFunctionsFromSource,
  GetJSFunctionsFromSource,
};

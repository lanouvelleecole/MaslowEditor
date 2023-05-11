import * as fs from "fs";
import * as path from "path";
import { start } from "repl";
import { RemoveExportFromFunction } from "../GetMoveCodeToFileDisposable/GetVariablesUsedInCode";
import { IsCodeIndented } from "../GetMoveCodeToFileDisposable/MoveCodeToFile";
import {
  GetGlobalJSFunctionsFromFile,
  GetGlobalJSFunctionsFromSource,
  GetJSFunctionsFromSource,
} from "../services/GetGlobalJSFunctions/GetGlobalJSFunctions";

function GetGlobalFunctionsArgs(filePath: string) {
  const result = [];
  const functions = GetGlobalJSFunctionsFromFile(filePath);

  for (const func of functions) {
    const argList = func.match(/\((.*?)\)/)?.at(1);
    const argNames = argList
      ? argList.split(",").map((arg) => arg.trim())
      : null;
    result.push(argNames);
  }

  return result;
}

function GetGlobalFunctionsNames(filePath: string): string[] {
  const functions = GetGlobalJSFunctionsFromFile(filePath);
  return functions.map((func) => {
    const funcNameMatch = /function\s+([^\s(]+)/.exec(func);
    const varNameMatch = /(const|let|var)\s+([^\s=]+)/.exec(func);
    const arrowFuncNameMatch = /([^\s]+)\s*=\s*\(/.exec(func);
    const functionSignatureMatch = /\bfunction\s+([^(]+)/.exec(func);

    return (
      funcNameMatch?.[1] ||
      varNameMatch?.[2] ||
      arrowFuncNameMatch?.[1] ||
      functionSignatureMatch?.[1].trim() ||
      ""
    );
  });
}

function GetGlobalFunctionsBodies(filePath: string): string[] {
  const functions = GetGlobalJSFunctionsFromFile(filePath);
  return functions.map((f) => {
    return getFunctionBody(f);
  });
}

function GetJSFunctionsArgsFromSample(sample: string) {
  const result = [];
  const functions = GetJSFunctionsFromSource(sample);

  for (const func of functions) {
    const argList = func.match(/\((.*?)\)/)?.at(1);
    const argNames = argList
      ? argList.split(",").map((arg) => arg.trim())
      : null;
    result.push(argNames);
  }

  return result;
}

function GetJSFunctionsNamesFromSample(sample: string): string[] {
  const functions = GetJSFunctionsFromSource(sample);
  return functions.map((func) => {
    const funcNameMatch = /function\s+([^\s(]+)/.exec(func);
    const varNameMatch = /(const|let|var)\s+([^\s=]+)/.exec(func);
    const arrowFuncNameMatch = /([^\s]+)\s*=\s*\(/.exec(func);
    const functionSignatureMatch = /\bfunction\s+([^(]+)/.exec(func);

    return (
      funcNameMatch?.[1] ||
      varNameMatch?.[2] ||
      arrowFuncNameMatch?.[1] ||
      functionSignatureMatch?.[1].trim() ||
      ""
    );
  });
}

function GetJSFunctionsBodiesFromSample(sample: string): string[] {
  const functions = GetJSFunctionsFromSource(sample);
  return functions.map((f) => {
    return getFunctionBody(f);
  });
}

function getFunctionBody(code: string): string {
  let startBracket, startBody;

  const apex = ") {";
  const foot = ") => {";

  if (code.indexOf(") {") !== -1) {
    startBracket = code.indexOf(apex);
    startBody = startBracket + apex.length;
  } else {
    startBracket = code.indexOf(foot);
    startBody = startBracket + foot.length;
  }

  if (startBracket === -1) {
    throw new Error("Function body not found.");
  }
  const endBody = code.indexOf("\n}", startBody);

  if (endBody === -1) {
    throw new Error("Function body end not found.");
  }

  const body = code.substring(startBody, endBody).trim();

  return body;
}

export {
  GetGlobalFunctionsNames,
  GetGlobalFunctionsArgs,
  GetGlobalFunctionsBodies,
  GetJSFunctionsNamesFromSample,
  GetJSFunctionsArgsFromSample,
  GetJSFunctionsBodiesFromSample,
};

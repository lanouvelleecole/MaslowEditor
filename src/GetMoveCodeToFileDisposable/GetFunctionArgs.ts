import { removeDuplicatesFromArray } from "./removeDuplicatesFromArray";

export function GetFunctionArgs(code: string) {
  const functionRegex = /function\s*(\w*)?\s*\((.*?)\)/g;
  const arrowFunctionRegex = /([a-zA-Z0-9_$]*)?\s*=>\s*{?/;
  const methodRegex = /(\w*)?\s*\((.*?)\)\s*{/;
  const classMethodRegex = /\w*\s*\((.*?)\)\s*{/;
  const generatorRegex = /function\s*(\w*)?\s*\*\s*\((.*?)\)/g;
  const asyncFunctionRegex = /async\s*function\s*(\w*)?\s*\((.*?)\)/g;
  const asyncArrowFunctionRegex = /([a-zA-Z0-9_$]*)?\s*=>\s*{?/;

  let match,
    args: any[] = [];

  // Function declaration
  while ((match = functionRegex.exec(code))) {
    if (match[2]) {
      args = args.concat(match[2].split(",").map((arg) => arg.trim()));
    }
  }

  // Function expression or arrow function expression
  match = arrowFunctionRegex.exec(code);
  if (!match) {
    match = /const\s*(\w*)?\s*=\s*function\s*\((.*?)\)/g.exec(code);
  }
  if (match && match[2]) {
    args = args.concat(match[2].split(",").map((arg) => arg.trim()));
  }

  // Method definition
  match = methodRegex.exec(code);
  if (match && match[2]) {
    args = args.concat(match[2].split(",").map((arg) => arg.trim()));
  }

  // Class method definition
  match = classMethodRegex.exec(code);
  if (match && match[1]) {
    args = args.concat(match[1].split(",").map((arg) => arg.trim()));
  }

  // Generator function
  while ((match = generatorRegex.exec(code))) {
    if (match[2]) {
      args = args.concat(match[2].split(",").map((arg) => arg.trim()));
    }
  }

  // Async function or async arrow function
  match = asyncFunctionRegex.exec(code) || asyncArrowFunctionRegex.exec(code);
  if (match && match[2]) {
    args = args.concat(match[2].split(",").map((arg) => arg.trim()));
  }

  return removeDuplicatesFromArray(args);
}

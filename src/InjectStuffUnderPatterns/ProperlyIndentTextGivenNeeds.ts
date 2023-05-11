import { Constants } from "./Constants.js";
import {
  ProperlyIndentFirstLine,
  ProperlyIndentString,
} from "./ProperlyIndentString.js";

export function ProperlyIndentTextGivenNeeds(
  indent: string | boolean,
  stuffUnderPattern: any,
  howManySpacesB4Pat: number
) {
  if (indent == Constants.only_first) {
    return ProperlyIndentFirstLine(
      `\n${stuffUnderPattern}`,
      howManySpacesB4Pat
    ).trimEnd();
  } else if (indent == true) {
    return ProperlyIndentString(
      `\n${stuffUnderPattern}`,
      howManySpacesB4Pat
    ).trimEnd();
  } else {
    return `\n${stuffUnderPattern}`;
  }
}

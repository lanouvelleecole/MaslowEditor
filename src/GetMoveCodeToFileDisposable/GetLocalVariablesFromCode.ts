import * as fs from "fs";
import { removeDuplicatesFromArray } from "./removeDuplicatesFromArray";
import { GetFunctionArgs } from "./GetFunctionArgs";
import { GetSpacesBeforeCharacters } from "../InjectStuffUnderPatterns/GetSpacesBeforeCharacters";
import { kMaxLength } from "buffer";

/**
 *
 * @param filePath, le path du fichier d'ou vient codePiece
 * @param codePiece, un morceau de code js/ts venant de filePath
 *
 * @returns la liste de variables locales dans le le body de la fonction,
 * en dessus seulement de codePiece, on ignore les variables locales en dessous de codePiece,
 * et on ignore aussi les variables locales qui ont + d'indentation que codePiece.
 */
export function GetLocalVariablesFromCode(
  filePath: fs.PathOrFileDescriptor,
  codePiece: string
) {
  // le panier à constantes/variables locales d'une fonction
  let basket: any[] = [];

  // le ou les args de cette fonction
  let funcArgs: string[] = [];

  try {
    // le code source de filePath
    const code = fs.readFileSync(filePath, "utf-8");

    // le morceau de code venant d'une fonction
    // sans espaces au début et a la fin
    codePiece = codePiece.trim();

    // la zone de recherche termine juste avant ce morceau de code
    const searchEnd = code.indexOf(codePiece);

    // si le morceau de code n'existe pas, alors stop
    if (searchEnd === -1) {
      return basket;
    }

    // combien de indentation existe juste avant ce morceau de code ?
    let qtySpacesBeforeCodePiece = GetSpacesBeforeCharacters(code, codePiece);

    // le morceau de code, du tout début (ligne 0) jusqu'au morceau de code
    const codeBeforeSearchEnd = code.slice(0, searchEnd);

    // le ou les args de cette fonction
    funcArgs = GetFunctionArgs(codeBeforeSearchEnd);

    // un regex qui détecte toutes les lignes de code sans indentation
    const regex_func_start = /\r?\n[^\s]/g;

    // contiendra l'index du tout début du code de la fonction
    let match_func_start;

    // l'index de la toute dernière ligne de code non indentée,
    // juste avant le morceau de code
    // (on peut donc supposer que cela correspond au tout début de la fonction contenant ce morceau
    //  supposant que le code n'est pas un code de cochon satanique mal formatté)
    let lastIndex = 0;

    // tant que l'on a pas atteint ce début de fonction, keep trucking.... !!!
    while (
      (match_func_start = regex_func_start.exec(codeBeforeSearchEnd)) !== null
    ) {
      // stocke le tout dernier index de ligne non indentée (AKA index de début de fonction)
      lastIndex = match_func_start.index;
    }

    // on stocke ici l'index (présupposé !?!) de début de fonction à rechercher
    const searchStart = lastIndex === 0 ? 0 : lastIndex + 1;

    // si cet index de ligne non indentée AKA début de fonction,
    // n'a pas été trouvé, alors stop
    if (searchStart === 0) {
      return basket;
    }

    // le morceau de code débutant au début de la fonction contenant
    // le morceau de code, et se terminant juste avant ce morceau de code
    const codePieceToBeInvestigated = code.slice(searchStart, searchEnd);

    // un regex qui cherche les variables constantes commençant par var const let
    const variablesRegex = new RegExp(
      "\\r?\\n\\s{0," +
        qtySpacesBeforeCodePiece +
        "}(let|const|var)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*(=|\\(|;)",
      "g"
    );

    // une des variables/constantes, ou null si rien trouvé
    let match;

    // Tant qu'il existe une variable/constante dans codePieceToBeInvestigated...
    while ((match = variablesRegex.exec(codePieceToBeInvestigated)) !== null) {
      // The if statement checks whether
      // the current match index is the same
      // as the last index of the regular expression.
      // If they are the same, it means that the regular expression
      // matched an empty string, so the loop increments
      // the lastIndex property of the variablesRegex
      // object to avoid an infinite loop.
      if (match.index === variablesRegex.lastIndex) {
        variablesRegex.lastIndex++;
      }

      // The match[2] element of the match array
      // contains the text of the matched variable...
      const matchedVar = match[2];

      // le match de début de variable/constante, en entier
      const wholeMatch = match[0].substring(1);

      // stocke l'indentation de cette variable/constante
      const varIndentation: number | null = GetSpacesBeforeCharacters(
        wholeMatch,
        wholeMatch.trim()
      );

      // ...stocke l'indentation et le nom de cette variable
      basket.push({ varName: matchedVar, varIndentation });
    }
  } catch (error) {
    console.error(error);
    return basket;
  }

  // supprime les variables/constantes non atteignables
  basket = RemoveUnreachableIdentifiers(basket);

  // ajoute dans le panier a var/const,
  // les args de la fonction contenant le morceau de code
  basket = basket.concat(funcArgs);

  // enlève les duplicatas éventuels
  return removeDuplicatesFromArray(basket);
}

function RemoveUnreachableIdentifiers(
  identifiers: { varName: string; varIndentation: number }[]
): string[] {
  const reversedIdentifiers = [...identifiers].reverse(); // Reverse the input array

  let prevIndentation = Infinity;
  const filteredIdentifiers = reversedIdentifiers.filter((identifier) => {
    if (identifier.varIndentation <= prevIndentation) {
      prevIndentation = identifier.varIndentation;
      return true;
    } else {
      return false;
    }
  });

  const mappedIdentifiers = filteredIdentifiers
    .reverse()
    .map((identifier) => identifier.varName); // Reverse the filtered array and map it to varName

  return mappedIdentifiers;
}

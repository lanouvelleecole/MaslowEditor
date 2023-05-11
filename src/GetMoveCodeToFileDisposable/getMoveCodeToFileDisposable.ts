import * as vscode from "vscode";
import { MoveCodeToFile } from "./MoveCodeToFile";

export function getMoveCodeToFileDisposable() {
  return vscode.commands.registerCommand(
    "masloweditor972.moveCodeToFile",
    async () => {
      await MoveCodeToFile();
    }
  );
}

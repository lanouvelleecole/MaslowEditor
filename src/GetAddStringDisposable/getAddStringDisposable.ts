import * as vscode from "vscode";

export function getAddStringDisposable() {
  return vscode.commands.registerCommand(
    "masloweditor972.addString",
    async () => {
      let editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No file opened");
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      await vscode.env.clipboard.writeText(text);

      let filePath = editor.document.uri.fsPath;
      let command = `maslow add-string-quick "${filePath}"`;

      let terminal = vscode.window.activeTerminal;

      if (!terminal) {
        terminal = vscode.window.createTerminal();
      }

      terminal.sendText(command);
      terminal.show();
    }
  );
}

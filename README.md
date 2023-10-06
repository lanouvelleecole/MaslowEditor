# masloweditor

Some useful utilities for Javascript developers.

Please bear in mind that this is a work in progress, and tons of features will be added soon.

## The Keybindings (More will come soon, stay tuned soldiers !)

### CTRL + SHIFT + I

Allows you to add the currenly highlighted string 
(MUST BE A STRING WITH IT'S QUOTES !!!!!)
to the latest string repository specified during the last use of the ```npx maslow add-string``` command.

### CTRL + SHIFT + M

Allows you to move the files specified by the highlighted imports.

The imports should be relative imports, looking like:

import { import_name } from "relative_path";

The import line should look like above, with only one import name between the brackets, and the path should be a relative path, pointing to a file, with or without extension.

(A lot of improvements will be made, and soon, all Javascript imports will work, but I'm busy with other stuff right now, so be patient ;-)

### CTRL + SHIFT + F

Moves highlighted code (a piece of the body of a Javascript function, or 1 or more Javascript functions) to a new file, in a newly created function.

### CTRL + SHIFT + J

Finds missing imports. Sometimes, you know what I mean, an import is John Doe,
and you want to know where it's at ? This keybinding will modify the path of the highlighted imports, if any of these imports point to a non existent file, and there's another file with the same name somewhere in the currenly opened VSCODE folder, then we change the path of that import to this existing file. It can help sometimes when trying to revive a dead project or similar situations.

As I already said above, the imports should be relative imports, looking like:

import { import_name } from "relative_path";

Soon it will be better, be patient homie ;-)

The problem with this VS Code extension is,
it only works in debug mode (via F5), but when I make a VSIX,
then the keybinding commands are not found.

Maybe my StackOverflow brotherhood will help me figure this out, who knows....

In the meantime, I save this piece of work here, and I'll moe the 4 keybindings to the MaslowGPT side of things.

## To build and install the package

Install vsce:

Make sure you have Node.js installed. Then run:

    npm install -g vsce

Run these commands to install the extension in your VSCODE editor

    vsce package  
    code --install-extension <vsix_file_name>.vsix
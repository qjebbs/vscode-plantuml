### 1.2.5
- Improvement: Preview don't show when no diagram found in document. Resolve [#7](https://github.com/qjebbs/vscode-plantuml/issues/7).
- Fix: "note top|bottom of" highlight. fix [#8](https://github.com/qjebbs/vscode-plantuml/issues/8).

### 1.2.4
- Fix: process leak when type with input method.
- Many optimizations & small fixes.

### 1.2.3
- Improvement: generating error of a diagram (or file) won't stop the next generating.
- Fix & Improvement: collect and show every single error when export document / workspace.
- OpenIconic snippet
- Other improvements

### 1.2.2
- Fix: resources drained & lag caused by auto update preview.
- Improvement: Error display in preview is less annoying.
- Fix: Not updated preview sometimes when switch to another file.

### 1.2.1
- New Feature: Add context menus for PlantUML file.
- Fix: Cannot export when no workspace open.
- Code optimization

### 1.2.0
- New Feature: Add ability to generate the compressed URL for a diagram.
- Improvement: Show errors in output panel.

### 1.1.3

- Improvement: Support naming diagram when diagram starts and resolve [#2](https://github.com/qjebbs/vscode-plantuml/issues/2)
- Improvement: Should have the file saved before export to avoid unexpected export location.

### 1.1.2

- Improvement: Add part of snippets. Type `egg` and see what happens!

### 1.1.1

- Improvement: export workspace diagrams will be organized in a directory named with "out" by default. you can changed directory name with setting `plantuml.exportOutDirName`.

### 1.1.0

- New Feature: Export workspace diagrams
- Add more suffixes: ".iuml", ".plantuml"
- Small improvements
- Changed command name and display

### 1.0.5

- `plantuml.exportFormat` default is not set, user may pick one format everytime exports. You can still set a format for it if you don't want to pick. Setting enumeration added.
- currnet document remains active after preview command
- Bug Fix: Update twice when trigger preview command
- code optimization

### 1.0.4

- Improvement: Update preview when move cursor to another diagram
- Improvement: Stop watching when preview closed. But it has a 3 minutes delay due to [#13623](https://github.com/Microsoft/vscode/issues/13623)
- Bug Fix: Remove excess "PlantUML:" display in Command Palette

### 1.0.3

- Bug Fix: dealing with unsaved file
- New Feature: Symbol list support

### 1.0.2

- Improvement: custom error display

### 1.0.1

- Bug Fix: export diagram without title

### 1.0.0

- Initial release ...
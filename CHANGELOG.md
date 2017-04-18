### 1.5.0
- New Feature: Zoom & scroll in preview. [#18](https://github.com/qjebbs/vscode-plantuml/issues/18)
- New Feature: Export selected workspace file in exploer panel.
- New Feature: Add setting `plantuml.fileExtensions` which allows you add your own extensions so as to export diagrams in source code files, like ".java".

### 1.4.2
- Improvement: Preview now supports svg to improve display in high DPI situation, though it doesn't support some diagrams. Thanks to [shepherdwind](https://github.com/shepherdwind).

### 1.4.1
- New Feature: Instant preview. 

> Generating a complex diagram often takes 6-8 seconds, user waits too long. With instant preview, the PROCESSING PAGE will show the exported image (if exists) before the rendering image is ready.

### 1.4.0
- New snippets, cover all type diagrams. Modified from [zhleonix](https://github.com/zhleonix) / [vscode-plantuml-ext](https://github.com/zhleonix/vscode-plantuml-ext/blob/r1.0.0/snippets/snippets.json) with many fixes.
- Fix: Invalid characters are not fully cleared in export file name. [#17](https://github.com/qjebbs/vscode-plantuml/issues/17)
- Add 2 file commands in context menu.

### 1.3.0
- New Feature: Localization support & add translation of "zh-cn" and "ja". Any translations are welcome.
- Fix some syntax highlight.

> Thanks to [koara-local](https://github.com/koara-local) for the "ja" translation and syntax fixes.

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
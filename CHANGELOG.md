# VSCode PlantUML Changelog

## 2.9.7

- New Setting: Added `includeSearch` to restore previous include files search logic.

## 2.9.6

- Improvement: make `jarArgs` resource scope, so that users can have different config between workspaces. See [discusses here](https://github.com/qjebbs/vscode-plantuml/issues/152#issuecomment-428479976).

## 2.9.5

- Improvement: Preview now based on WebView, together with many optimizations.
- Improvement: Fixed include path (use `diagramsRoot`) for preprocessing (like `!include`), solve [#152](https://github.com/qjebbs/vscode-plantuml/issues/152)
- Update package dependecies

## 2.9.4

- Fix: Some bugs.

## 2.9.3

- New Setting: Added `diagramsRoot` to specify where diagram files located.
- Improvement: The setting `exportOutDirName` has been changed to `exportOutDir`
- Improvement: Eliminate `No valid diagram found here!` tip in some cases.

Has `diagramsRoot` worked together with `exportOutDir`, you can (for example):

```json
"plantuml.diagramsRoot": "docs/diagrams/src",
"plantuml.exportOutDir": "docs/diagrams/out"
```

You'll get export results like:

```
Project Folder/
  docs/
    diagrams/
      src/
        architecture_overview.wsd
      out/
        architecture_overview.png
```


## 2.9.2

- Fix: fix error reading jar setting for non-worspaceFolder file, fix [#149](https://github.com/qjebbs/vscode-plantuml/issues/149)

## 2.9.1

- Improvement: Show digram errors reported by plantuml server, solve [#148](https://github.com/qjebbs/vscode-plantuml/issues/148)
- Improvement: 'jar' setting now in resource scope, you can use different jar settings for different workspace folders. solve [#147](https://github.com/qjebbs/vscode-plantuml/issues/147)


## 2.9.0

- New Feature: Initial support of [Macros](http://plantuml.com/preprocessing) IntelliSense (Code Completion & Signature Prompt). 
Thanks [Ricardo Niepel](https://github.com/RicardoNiepel) for the great work..

## 2.8.6

- Fix: Fix preview drag in 1.26.0, solve [#141](https://github.com/qjebbs/vscode-plantuml/issues/141)
- Code optimize.

## 2.8.5

- Fix: Cannot scroll to position after preview zoom in VSCode 1.26.0

## 2.8.4

- Improvement: Multi-page export file names optimize, solve [#134](https://github.com/qjebbs/vscode-plantuml/issues/134)

## 2.8.3

- Disable formatter if formatOnSave is on, solve [#130](https://github.com/qjebbs/vscode-plantuml/issues/130)

## 2.8.2

- Fix: Duplicate an editor in preview column while starting preview in VSC 1.25.0

## 2.8.1

- Improvement: Hide snap indicators by default, but snap works as it was. 

> Use `plantuml.previewSnapIndicators` to control the indicators visibility.

## 2.8.0

- New Feature: Snap to Bottom/Right, resolves [#128](https://github.com/qjebbs/vscode-plantuml/issues/128)
- Improvement: Icon & code optimize.

    Snap to Bottom is useful while writing long activity diagrams, which helps you keep focus in the latest part in the bottom.

    How To: Scroll to bottom or/and right till the snap indicator appears.  
    > Thanks [Zooce](https://github.com/Zooce) for the feedback

## 2.7.6

- Improvement: Better keep status between quick preview and preview page. (block unwanted resize event)
- Improvement: Add ";" to snippets prefixes to avoid typing conflict, solve [#124](https://github.com/qjebbs/vscode-plantuml/issues/124)

## 2.7.5

- New Feature: Full functional processing / quick preview page.
- New Feature: Always request svg for preview, but compatible to some special diagrams outputs of png.
- Improvement: Smaller loading animation when quick preview
- Improvement: Controls bar don't covers the image now
- Improvement: Remove unnecessary margins.
- Improvement: Align long image to window top when reset to fit window.
- Improvement: Reset to fit window if zoom out to minimal zoom.
- Fix: Sometimes toggle icon incorrect.
- Fix: Wrong natural size if multi-page.
- Don't limit png max zoom to 100.
- Remove setting `previewFileType`

## 2.7.0

- New Feature: Zoom to selected area.
- New Feature: Click to zoom in, Alt+Click to zoom out.
- Improvement: New preview look, better inspecting image shape and size.
- Improvement: Better following mouse pointer in zoom, especially zooming at a point at the bottom of image.
- Improvement: Keep zoom and scroll status for all pages.
- Improvement: Improved keeping status after edit & auto refresh.
- Change `previewFileType` default setting to `svg`.

> Notice:  
> - Right mouse button drag to pan preview.
> - Toggle zoom by double click has been removed, please consider the toggle button, or middle mouse button.
> - Scroll zoom removed, please consider new features, or Ctrl + Scroll.

## 2.6.3

- Improvement: Smoothly zooming.
- Improvement: Add zooming controls.
- Improvement: Double click to switch zooming between fit window / original size
- Fix: Restart watching after preview is closed by VSCode, resolve [#89](https://github.com/qjebbs/vscode-plantuml/issues/89).

## 2.6.1

- Fix: previewWheelAction default value.

## 2.6.0

- Improvement: Optimized for MacOS touchpad.

## 2.5.12

- Fix: If-else format, resolve [#116](https://github.com/qjebbs/vscode-plantuml/issues/116).

## 2.5.11

- Fix: No diagram tip on first open preview, resolve [#115](https://github.com/qjebbs/vscode-plantuml/issues/115).
- Code optimize.

## 2.5.10

- Update embedded default plantuml.jar

## 2.5.9

- Improvement: Configurable Java executable path, resolve [#72](https://github.com/qjebbs/vscode-plantuml/issues/72), [#112](https://github.com/qjebbs/vscode-plantuml/issues/112)
- Update traditional chinese translation.
- Fix: Graphviz download url. Thanks [binderclip](https://github.com/binderclip).

## 2.5.8

- Fix: Calc auto include for no-current-workspace file, resolve [#110](https://github.com/qjebbs/vscode-plantuml/issues/110)
- Improvement: Error catch optimize
- Code optimize.

## 2.5.7

- Fix: Read config for unsaved file issue, resolve [#109](https://github.com/qjebbs/vscode-plantuml/issues/109)

## 2.5.6

- Fix: Some syntax highligh and formating fixes.
- Code optimize.

## 2.5.5

- Fix: Some syntax highlights fix,
[#99](https://github.com/qjebbs/vscode-plantuml/issues/99)
[#100](https://github.com/qjebbs/vscode-plantuml/issues/100)
[#101](https://github.com/qjebbs/vscode-plantuml/issues/101)
[#102](https://github.com/qjebbs/vscode-plantuml/issues/102)
- Improvement: Treat entire diagram file as a diagram, if not `@startxxx` is given, solve [#91](https://github.com/qjebbs/vscode-plantuml/issues/91)

## 2.5.4

- Improvement: Add setting `jarArgs`, solve [#97](https://github.com/qjebbs/vscode-plantuml/issues/97)
- Improvement: Remove error text display below the preview image.
- Fix: Some syntax highlight fix, solve [#83](https://github.com/qjebbs/vscode-plantuml/issues/83), [#96](https://github.com/qjebbs/vscode-plantuml/issues/96)

## 2.5.3

- Improvement: Syntax highlight for PlantUML code inside Markdown. Thanks to [cazeaux](https://github.com/qjebbs/vscode-plantuml/pull/95).
- Code optimize.

## 2.5.2

- Improvement: Lazy check java, solve [#93](https://github.com/qjebbs/vscode-plantuml/issues/93)

## 2.5.1

- Fix: Incorrect logic for source scope settings, [#90](https://github.com/qjebbs/vscode-plantuml/issues/90)

## 2.5.0

- Improvement: Full multi-root workspace support.

## 2.4.0

- New Feature: Add command for extracting source from png files.
- New Feature: Image map (cmapx) export. Configure `exportMapFile` true to enable it.
- New Feature: %filename% var support.
- Update embeded `plantuml.jar` to latest.
- Some optimizations.
- Bug fixes & Code optimizations.

Thanks [arnaudroques](https://github.com/arnaudroques) for working on `plantuml.jar` for these features.

## 2.3.3

- Fix: 
[#68](https://github.com/qjebbs/vscode-plantuml/issues/68), 
[#74](https://github.com/qjebbs/vscode-plantuml/issues/74). 

Thanks [c835722](https://github.com/c835722) for figuring out how it occurs.

## 2.3.2

- Fix: Formating problems. 
[#70](https://github.com/qjebbs/vscode-plantuml/issues/70), 
[#73](https://github.com/qjebbs/vscode-plantuml/issues/73)

## 2.3.1

- Change diagram default name rule, resolve [#69](https://github.com/qjebbs/vscode-plantuml/issues/69)

## 2.3.0

- Improvement: Syntax error folded into an icon in preview, to reduce distraction during authoring.
- Improvement: Preview logic optimize
- Improvement: Add ja translation
- Fix: Autoupdate not work on unsaved, fix [#65](https://github.com/qjebbs/vscode-plantuml/issues/65)

## 2.2.2

- Fix: Incorrect initial zoom level when preview image is small
- Improvement: Target not changed when move cursor to none-diagram area, resolve [#62](https://github.com/qjebbs/vscode-plantuml/issues/62)

## 2.2.1

- Improvement: Add sequence grouping formatting. Fix [#60](https://github.com/qjebbs/vscode-plantuml/issues/60)
- Fix: Apostrophe syntax highligting. [#59](https://github.com/qjebbs/vscode-plantuml/issues/59)

## 2.2.0

- New Feature: Added diagnosis in case someone ignores naming and name problems.
- Improvement: Do not limit zoom level for svg in preview.

![diagnosis](https://user-images.githubusercontent.com/16953333/30105320-cd04745e-932a-11e7-81f4-f6adeb863cb9.png)

## 2.1.3

- Improvement: Add de translation

## 2.1.2

- Add choices support to snippets
- Code optimize, try to fix [#54](https://github.com/qjebbs/vscode-plantuml/issues/54)

## 2.1.1

- Fix: Missing syntax highlight in v2.1.0

## 2.1.0

- New Feature: MarkDown integrating support.
- Small Improvements

## 2.0.2

- Improvement: Improve block formatting
- Improvement: Add ja translation
- Update intergrated plantuml.jar

Give up inline formatting, because PlantUML is too flexible. So ~~`plantuml.experimental.formatInLine`~~ has been removed.

## 2.0.1

Fix: Always show welcome message.

## 2.0.0

Release 2.0.0 is a massive code refactored version, which brings you:

- New Feature: Users are allowed to choose their render, which applied to both preview and export. In other words, users can get **15X times faster export** by utilizing PlantUML Server as render.
- Improvement: Totally rewrite format code, so that it can format more complicated codes. Though it's still experimental.
- Improvement: Maintain status (zoom, postion, page) after preview refreshing.
- Other small Improvements

Note that some settings are changed:

- `plantuml.previewFromUrlServer` has been replaced by `plantuml.render`
- `plantuml.urlServer` has been renamed to `plantuml.server`
- `plantuml.urlServerIndexParameter` has been renamed to `plantuml.serverIndexParameter`

## 1.8.2

- Fix: Preview flashes while previewing from server and quick switching between diagrams.

## 1.8.1

- Fix: Preview form server, and add multipage support to it. Thanks to [Martin Riedel](https://github.com/qjebbs/vscode-plantuml/pull/45).
- Fix: Error on quickly switch in preview.
- New Feature: Export report.
- Improvement: Setting descriptions now localizable.
- Improvement: Normalized snippets.
- Improvement: Hide preview scroll bar.

## 1.8.0

- New Feature: Multi-page diagram preview & export supprot.

## 1.7.1

- Add "zh-tw" language and update "ja" translation.
- Small syntax highlight fix.

## 1.7.0

- New Feature: Format support. Indent and inline format (Experimental).
- Improvement: Zoom follows your mouse pointer. Optimized when window resize
- Improvement: User now is able to customize export command args, like `-DPLANTUML_LIMIT_SIZE=8192`
- Improved readme.

## 1.6.2

- New Feature: Preview through PlantUML server. Thanks to [Martin Riedel](https://github.com/qjebbs/vscode-plantuml/pull/34).
- Improvement: Optimization of minimal zoom status in preview.
- Other fix and optimization.

## 1.6.1

- Improvement: Many many syntax highlight optimization.
- Improvement: Small code & snippet  optimization.

## 1.6.0

- New Feature: Auto include. See README for more detail.
- New Feature: Add setting `plantuml.jar` which allows you use your own jar (maybe a newer version, or with many dependent jars).
- Fix: Many syntax highlights fixes.

## 1.5.0

- New Feature: Zoom & scroll in preview. [#18](https://github.com/qjebbs/vscode-plantuml/issues/18)
- New Feature: Export selected workspace file in exploer panel.
- New Feature: Add setting `plantuml.fileExtensions` which allows you add your own extensions so as to export diagrams in source code files, like ".java".

## 1.4.2

- Improvement: Preview now supports svg to improve display in high DPI situation, though it doesn't support some diagrams. Thanks to [shepherdwind](https://github.com/shepherdwind).

## 1.4.1

- New Feature: Instant preview.

> Generating a complex diagram often takes 6-8 seconds, user waits too long. With instant preview, the PROCESSING PAGE will show the exported image (if exists) before the rendering image is ready.

## 1.4.0

- New snippets, cover all type diagrams. Modified from [zhleonix](https://github.com/zhleonix) / [vscode-plantuml-ext](https://github.com/zhleonix/vscode-plantuml-ext/blob/r1.0.0/snippets/snippets.json) with many fixes.
- Fix: Invalid characters are not fully cleared in export file name. [#17](https://github.com/qjebbs/vscode-plantuml/issues/17)
- Add 2 file commands in context menu.

## 1.3.0

- New Feature: Localization support & add translation of "zh-cn" and "ja". Any translations are welcome.
- Fix some syntax highlight.

> Thanks to [koara-local](https://github.com/koara-local) for the "ja" translation and syntax fixes.

## 1.2.5

- Improvement: Preview don't show when no diagram found in document. Resolve [#7](https://github.com/qjebbs/vscode-plantuml/issues/7).
- Fix: "note top|bottom of" highlight. fix [#8](https://github.com/qjebbs/vscode-plantuml/issues/8).

## 1.2.4

- Fix: process leak when type with input method.
- Many optimizations & small fixes.

## 1.2.3

- Improvement: generating error of a diagram (or file) won't stop the next generating.
- Fix & Improvement: collect and show every single error when export document / workspace.
- OpenIconic snippet
- Other improvements

## 1.2.2

- Fix: resources drained & lag caused by auto update preview.
- Improvement: Error display in preview is less annoying.
- Fix: Not updated preview sometimes when switch to another file.

## 1.2.1

- New Feature: Add context menus for PlantUML file.
- Fix: Cannot export when no workspace open.
- Code optimization

## 1.2.0

- New Feature: Add ability to generate the compressed URL for a diagram.
- Improvement: Show errors in output panel.

## 1.1.3

- Improvement: Support naming diagram when diagram starts and resolve [#2](https://github.com/qjebbs/vscode-plantuml/issues/2)
- Improvement: Should have the file saved before export to avoid unexpected export location.

## 1.1.2

- Improvement: Add part of snippets. Type `egg` and see what happens!

## 1.1.1

- Improvement: export workspace diagrams will be organized in a directory named with "out" by default. you can changed directory name with setting `plantuml.exportOutDirName`.

## 1.1.0

- New Feature: Export workspace diagrams
- Add more suffixes: ".iuml", ".plantuml"
- Small improvements
- Changed command name and display

## 1.0.5

- `plantuml.exportFormat` default is not set, user may pick one format everytime exports. You can still set a format for it if you don't want to pick. Setting enumeration added.
- currnet document remains active after preview command
- Bug Fix: Update twice when trigger preview command
- code optimization

## 1.0.4

- Improvement: Update preview when move cursor to another diagram
- Improvement: Stop watching when preview closed. But it has a 3 minutes delay due to [#13623](https://github.com/Microsoft/vscode/issues/13623)
- Bug Fix: Remove excess "PlantUML:" display in Command Palette

## 1.0.3

- Bug Fix: dealing with unsaved file
- New Feature: Symbol list support

## 1.0.2

- Improvement: custom error display

## 1.0.1

- Bug Fix: export diagram without title

## 1.0.0

- Initial release ...
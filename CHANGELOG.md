# VSCode PlantUML Changelog

## 2.18.1

- Preview works with PlantUML Servers that don't generate image maps, [#579](https://github.com/qjebbs/vscode-plantuml/issues/579)

## 2.18.0

- Make links in preview clickable **moormaster**, [#572](https://github.com/qjebbs/vscode-plantuml/pull/572)
- Add PDF export format for Plantuml Server **moormaster**, [#545](https://github.com/qjebbs/vscode-plantuml/pull/545)

## 2.17.6

- Add configuration option to swap left and right mouse buttons, **@moormaster**, [#573](https://github.com/qjebbs/vscode-plantuml/pull/573)
- syntax related udpates, **@The-Lum**, [#504](https://github.com/qjebbs/vscode-plantuml/pull/504); **@pearj**, [#558](https://github.com/qjebbs/vscode-plantuml/pull/558)
- Update embedded jar to `1.2024.3-gplv2`

## 2.17.5

- Add configuration option to exclude folder heirarchy from exported file path, **@reub-the-cube**, [#522](https://github.com/qjebbs/vscode-plantuml/pull/522)
- Add preview button to PlantUML files, **@Cube707**, [#525](https://github.com/qjebbs/vscode-plantuml/pull/525)
- Update embedded jar to `1.2022.14`

## 2.17.4

- Fix: Promises of child processes killing function may not resolved, **@kristopher-pellizzi**, [#510](https://github.com/qjebbs/vscode-plantuml/issues/510)
- Update embedded jar to `1.2022.7`

## 2.17.3

- Fix: Context menu shouldn't show on Pan operation, [#413](https://github.com/qjebbs/vscode-plantuml/issues/413)
- Update syntax highlighting, [#491](https://github.com/qjebbs/vscode-plantuml/pull/491)
- Update embedded jar to `1.2022.5`

## 2.17.2

- Not fallback to get if post was at least once successful, **@z77ma**, [#470](https://github.com/qjebbs/vscode-plantuml/pull/470)
- Update translations, [#467](https://github.com/qjebbs/vscode-plantuml/pull/467)
- Update embedded jar to `1.2022.0`

## 2.17.0

- Add ability to copy image in preview, [#462](https://github.com/qjebbs/vscode-plantuml/pull/462)
- Update syntax highlighting, [#457](https://github.com/qjebbs/vscode-plantuml/pull/457)
- Update embedded jar to `1.2021.16`

## 2.16.1

- Add setting `plantuml.lintDiagramNoName`
- Fix plantuml fence detect ([#455](https://github.com/qjebbs/vscode-plantuml/issues/455))
- Update syntax highlighting ([#454](https://github.com/qjebbs/vscode-plantuml/pull/454))
- Update embedded jar to `1.2021.14`

## 2.16.0

- Not use title as diagram name ([#438](https://github.com/qjebbs/vscode-plantuml/issues/438), [#400](https://github.com/qjebbs/vscode-plantuml/issues/400), [#409](https://github.com/qjebbs/vscode-plantuml/pull/409)), please switch to `@startxxx name` instead.
- Add {uml} token to allow compatibility with Sphinx/MyST ([#444](https://github.com/qjebbs/vscode-plantuml/pull/444))
- Update syntax highlighting ([#419](https://github.com/qjebbs/vscode-plantuml/pull/419), [#425](https://github.com/qjebbs/vscode-plantuml/pull/425))
- Toggle Block Comment configuration ([#420](https://github.com/qjebbs/vscode-plantuml/pull/420))
- Update readme ([#446](https://github.com/qjebbs/vscode-plantuml/pull/446))

## 2.15.1

- Fix: Error in console while typing include ([#412](https://github.com/qjebbs/vscode-plantuml/issues/412))
- Update embedded jar to `1.2021.7`

## 2.15.0

- Improvement: Adopt to VSCode Workspace Trust
- Improvement: Ignore "Picked up" java stderr messages ([#391](https://github.com/qjebbs/vscode-plantuml/issues/391))
- Improvement: Add` ```puml rendering` support in the md file ([#397](https://github.com/qjebbs/vscode-plantuml/issues/397))
- Fix: Some machine-overridable scope settings not applied from workspace

## 2.14.5

- Fix: `previewAutoUpdate` setting instantly applied, fix [#381](https://github.com/qjebbs/vscode-plantuml/issues/381)
- Improvement: Apply `commandArgs` and `jarArgs` while extracting source code, [#388](https://github.com/qjebbs/vscode-plantuml/issues/388). Thanks to @evilru.

## 2.14.4

Some sensitive config, like `java`, `jar`, are potentially utilized by attackers. The lastest release has disabled by default the workspace/work folder level settings of them. To enable, you have to explicitly execute the command `PlantUML: Toggle Workspace Trust Flag` to trust the workspace.

> Thanks RyotaK for the report

## 2.14.3

- Improvement: Global `includepaths` setting will apply to digrams in markdown/unsaved files. [#375](https://github.com/qjebbs/vscode-plantuml/issues/375)

## 2.14.2

- Add: translation of "ko", [#371](https://github.com/qjebbs/vscode-plantuml/issues/371)
- Update embedded jar

## 2.14.1

- Fix: Cannot include if CRLF line end, [#357](https://github.com/qjebbs/vscode-plantuml/issues/357)
- Improvement: Export multi-files from files tree, [#358](https://github.com/qjebbs/vscode-plantuml/issues/358)
- Improvement: Preview image format detect, [#363](https://github.com/qjebbs/vscode-plantuml/issues/363)
- Improvement: Update embedded jar, [#361](https://github.com/qjebbs/vscode-plantuml/issues/361)

## 2.13.15

- Improvement: new java check logic
- Improvement: keywords completion optimize, [#335](https://github.com/qjebbs/vscode-plantuml/issues/335)

## 2.13.14

Update embedded jar

## 2.13.13

- Improvement: Imporve syntax highlighting in dark theme for messages of note, header, legend, footer.[#285](https://github.com/qjebbs/vscode-plantuml/pull/285)
- Improvement: Change language id to plantuml.[#306](https://github.com/qjebbs/vscode-plantuml/pull/306)
- Fix: Preview should not be scrollable when load

## 2.13.12

- Improvement: Adopt 'asWebviewUri' API,[#319](https://github.com/qjebbs/vscode-plantuml/pull/319)
- Improvement: Update extensionKind,[#304](https://github.com/qjebbs/vscode-plantuml/pull/304)

## 2.13.11

- Update embedded jar to `1.2020.10`

## 2.13.10

- Bug fixes

## 2.13.9

- Fix: the include preprocessor creating nested diagrams,[#314](https://github.com/qjebbs/vscode-plantuml/pull/314)
- Improvement: Fall back to GET optimize,[#300](https://github.com/qjebbs/vscode-plantuml/pull/300)

## 2.13.8

- Fix: Error when parse includes in some cases.

## 2.13.7

- Ensure comment toggles work in markdown
- Detect include loop
- Deprecated formatter

## 2.13.6

- Improvement: Add `extensionKind`,  better remote dev support, [#282](https://github.com/qjebbs/vscode-plantuml/pull/282)
- Improvement: Support syntax highlighting of class diagram functions and fields which contains more than `ascii` character, [#279](https://github.com/qjebbs/vscode-plantuml/pull/279)

## 2.13.5

- Improvement: Do not render diagram as object in markdown, due to [vscode-markdown-extended#67](https://github.com/qjebbs/vscode-markdown-extended/issues/67)
- Improvement: Include files search optimize

## 2.13.4

- Fix: `POST` with `Content-Type` header, fix encoding issue, [#274](https://github.com/qjebbs/vscode-plantuml/issues/274). Thanks to [@fengyie007](https://github.com/qjebbs/vscode-plantuml/issues/274#issuecomment-554228925).


## 2.13.3

- Fix: Remove dependency `request` to fix invalid png export, [#272](https://github.com/qjebbs/vscode-plantuml/issues/272).

## 2.13.2

- Improvement: Cannot include one file multiple times, avoiding include loop.
- Fix: Fix Markdown rendering, [#271](https://github.com/qjebbs/vscode-plantuml/issues/271).

## 2.13.1

- Improvement: Enables `POST` method for server render, you can now render very-large diagrams
- Improvement: The extension comes with a new `include processor`, you won't encounter include problems again.
- Removed: AutoInclude feature is removed, if you need this feature, please stay with `v2.12.2`

## 2.12.2

- Improvement: Enforce white background to markdown preview, [#257](https://github.com/qjebbs/vscode-plantuml/issues/257)
- Improvement: Update Japanese translation, thanks to [kannkyo](https://github.com/kannkyo)
- Improvement: Change `machine` scope setting to `machine-overridable`.

## 2.12.1

- Fix: Plantuml images not loaded by markdown preview, with strict policy. [#258](https://github.com/qjebbs/vscode-plantuml/issues/258).

## 2.12.0

- Improvement: Setting scope optimization, ready for [Remote Developpment](https://code.visualstudio.com/docs/remote/remote-overview).
- Improvement: Hide preview controls when cursor out, solve [#251](https://github.com/qjebbs/vscode-plantuml/issues/251)

## 2.11.3

- Improvement: Remove the default value of `plantuml.server`, to avoid unexpected data sharing.
- Improvement: Render Markdown iamges as object, solve [#253](https://github.com/qjebbs/vscode-plantuml/issues/253)
- Update integrated jar to `v1.2019.9`

## 2.11.2

- Fix: A zoom issue in latest version of VSCode on Windows. [#244](https://github.com/qjebbs/vscode-plantuml/issues/244).
- Update blue style - add coherence to activity diagram
- Code optimize.

## 2.11.1

- Improvement: Preview process killing optimize
- Update integrated jar to `v1.2019.6`, solve [#227](https://github.com/qjebbs/vscode-plantuml/issues/227), [#230](https://github.com/qjebbs/vscode-plantuml/issues/230).

## 2.11.0

- Improvement: Changed the include files search logic once again, which:

    1. Users don't have to choose from `diagramsRoot` or `SourceFlieDir`, because you have them both!
    1. New `plantuml.includepaths` to have other paths included.

    > Thanks [anotherandi](https://github.com/anotherandi) for the brilliant idea and implementation!
    
- Improvement: Add Danish translation

## 2.10.9

- Fix: include searching for chain include, solve [#209](https://github.com/qjebbs/vscode-plantuml/issues/209).

## 2.10.8

- Update integrated jar to `v1.2019.3`, to support [Mindmap Diagram](http://plantuml.com/mindmap-diagram)
- Fix: Preview postion reset when minimal zoom, solve [#207](https://github.com/qjebbs/vscode-plantuml/issues/207).
- Fix: `elseif` format, solve [#204](https://github.com/qjebbs/vscode-plantuml/issues/204).

## 2.10.7

- Fix: False alert of invalid jar when user configure relative jar path in workspace settings.
- Improvement: Auto completion now doesn't get language keywords from plantuml.jar. 

## 2.10.6

- Improvement: Generate urls now output all urls of a multi-page diagram.
- Improvement: Server render supports multi-page diagrams. Thanks to [Ulf Seltmann](https://github.com/plantuml/plantuml-server/issues/7#issuecomment-470509662).
- Improvement: Previewer cursor optimize.
- Improvement: Previewer instruction localizable.

> `plantuml.urlServerIndexParameter` has been removed.

## 2.10.5

- Improvement: Update French translation.
- Improvement: Add previewer instruction, solve [#195](https://github.com/qjebbs/vscode-plantuml/issues/195).
- Fix: A zoom issue in latest version of VSCode.

## 2.10.4

- Improvement: Add French translation & Update some English translation.
- Improvement: Don't filter out note texts for auto completion, solve [#194](https://github.com/qjebbs/vscode-plantuml/issues/194).
- Improvement: Language keywords auto completion don't use java if user don't use `Local` render.

## 2.10.3

- Fix: Preview page number may out of range, solve [#184](https://github.com/qjebbs/vscode-plantuml/issues/184).
- Fix: Cannot use `\` or `\\` in `jar` setting, solve [#170](https://github.com/qjebbs/vscode-plantuml/issues/170).

## 2.10.2

- Improvement: Keep fit to window status between preview updates
- Improvement: filter out JAVA_TOOL_OPTIONS errors, solve [#19](https://github.com/qjebbs/vscode-plantuml/issues/19).
- Code optimize for preview inside webview.

## 2.10.1

- Improvement: Many fixes & optimization to auto completion.
- Improvement: Bypass server render issue of [request/request#2505](https://github.com/request/request/issues/2505) in some environment.
- Fix: Cannot find module 'languageCompletion'
- Code optimize

## 2.10.0

- New Feature: Language keywords auto completion support.
- New Feature: A stupid version, kind of variable auto completion.
- Improvement: Auto completion now focuses in current diagram, not whole document.
- Improvement: Snippets optimization. Now the snippets should not bother while typing.

> Plus macro completion & signature contributed by [Ricardo Niepel](https://github.com/RicardoNiepel), works on intellisense will stop here, since the `PlantUML` syntax is too flexible and I'm not able to write a parser.

## 2.9.10

- Improvement: Preview updates when switch between file histories, fix [#173](https://github.com/qjebbs/vscode-plantuml/issues/173)

## 2.9.9

- Improvement: Server render respect 'http.proxy' setting, solve [#169](https://github.com/qjebbs/vscode-plantuml/issues/169)

## 2.9.8

- Improvement: Rename includeSearch options to avoid ambiguity
- Improvement: Request png for ditaa in md rendering, solve [#162](https://github.com/qjebbs/vscode-plantuml/issues/162)
- Update integrated `plantuml.jar` to `Version 1.2018.12`

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

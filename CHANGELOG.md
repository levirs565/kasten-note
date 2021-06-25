<a name="unreleased"></a>
## [Unreleased]


<a name="0.4.0"></a>
## [0.4.0] - 2021-06-25
- chore: use release-it git plugin
- chore: add release-it ([#2](https://github.com/levirs565/kasten-note/issues/2))
- refractor(lsp): rename some get function to provide
- perf(lsp): make getNodeInCursor faster
- feat(lsp): add completion for link
- refractor(lsp): remove unused async-await in provider
- refractor(lsp): do not return vscode model in provider
- refractor(lsp): pass processed param to provider
- refractor(lsp): new file relative action
- refractor(lsp): split setting management
- refractor(lsp): split server into provider
- refractor(lsp): code action link validation
- refractor(lsp): move link check impl
- refractor(lsp): move getCurrentNode
- refractor(lsp): remove unused variable
- feat(lsp): check link when note list changed
- fix(lsp): create file action not work in index
- feat(lsp): add code action for invalid link
- refractor(lsp): add type for wikilink node
- feat(lsp): pending link check when not ready
- feat(lsp): add wiki link diganostic
- fix(lsp): link target hover quote in newline
- feat(lsp): go to definition in wiki link
- feat(lsp): show link target when hovering wiki link
- feat: support for wiki link in lsp parser
- feat: add hover to lsp
- feat: parse and store ast of document
- feat: implement simple lsp based on sample
- feat: inform when error fixed when in quiet mode
- refractor: split file reading and writing from pipeline
- add changelog

### Pull Requests
- Merge pull request [#1](https://github.com/levirs565/kasten-note/issues/1) from levirs565/lsp


<a name="v0.3.0"></a>
## [v0.3.0] - 2021-06-02
- bump version
- build: update rehype katex to 5.0.0
- feat: add verbose mode to builder
- feat: remove wiki links logging in builder
- refractor: make listNotes promise
- feat: make erorr and info colorfull
- feat: make list action print table
- feat: make notice in build action blue
- feat: support rebuild in serve action
- refractor: move build action to actions.ts
- feat: support full rebuild in build action
- chore: add changelog


<a name="v0.2.1"></a>
## [v0.2.1] - 2021-05-25
- bump version
- fix: bin script not work in unix
- bump version to 0.2.0
- add change log


<a name="v0.2.0"></a>
## [v0.2.0] - 2021-04-23
- fix asset is not updated after deleted and notify page when asset changed
- fix rename action not rename dir when file is index.md
- use fs extra
- use fs extra for builder
- add support for adding image to markdown
- add stylesheet
- make pipeline set title by level 1 heading text
- add rename action
- refractor new note action
- make adding note return note id
- make note id case insensitive
- add action to create new note
- add support to get note by filename
- support raw html in markdown file
- rename kasten file to note
- add list command
- move watch to util
- increment version
- move get file id to base
- add start script to run in doc
- simplify wiki link and id handling
- add test using jest
- add instalation manual


<a name="v0.1.0"></a>
## v0.1.0 - 2021-04-13
- rename to kasten-note
- link readme to doc index
- add wiki link doc
- add markdown features doc
- add readme doc
- add gitignore
- use array instead of set in builder wiki links
- only run server when builder is finished first build
- add wikilink support
- fix toUnixPath not replace all forward slash
- make serve as class and separate build process from it
- make build as builder class
- add src dir option to tsconfig
- import package version from package.json
- init npm and add license
- add readme
- fix bin wrong and move [@types](https://github.com/types)/node to dev
- fix fs/promises module not found
- migrate index to typescript
- migrate serve to typescript
- migrate build to typescript
- migrate pipeline to typescript
- migrate util to typescript
- fix path with forward slash not live reloading
- add live reload to serve
- add serve command
- refractor dist path handling
- simplify markdown files selection
- use chokidar even when build is not watchin
- add option to clean before build
- add watching support for build
- make readDirRecursive can ignore files
- add command line argument support
- add gfm support
- add math support with katex
- fix mkdir not waited in pipeline/buildMarkdown
- move getCurrentDir to util.js
- process all markdown files
- move build function to pipeline.js
- support for processing index file
- add simple doc
- add find kasten dir functionality


[Unreleased]: https://github.com/levirs565/kasten-note/compare/0.4.0...HEAD
[0.4.0]: https://github.com/levirs565/kasten-note/compare/v0.3.0...0.4.0
[v0.3.0]: https://github.com/levirs565/kasten-note/compare/v0.2.1...v0.3.0
[v0.2.1]: https://github.com/levirs565/kasten-note/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/levirs565/kasten-note/compare/v0.1.0...v0.2.0

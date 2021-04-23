<a name="unreleased"></a>
## [Unreleased]


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


[Unreleased]: https://github.com/levirs565/kasten-note/compare/v0.2.0...HEAD
[v0.2.0]: https://github.com/levirs565/kasten-note/compare/v0.1.0...v0.2.0

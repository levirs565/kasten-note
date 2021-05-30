#!/usr/bin/env node
import { program } from "commander"
import { getCurrentDir } from "./util"
import { printListNotes, newNote, renameNote, BuildAction, ServeAction } from "./action"
import { version } from "../package.json"

program
  .name("kasten")
  .version(version)

const cleanOpt = ["--no-clean", "clean dist directory before build"]

interface BuildOpts {
  watch: boolean
  clean: boolean
}

program.command("build")
  .description("build all notes to HTML")
  .option(cleanOpt[0], cleanOpt[1])
  .option("-w, --watch", "watch directory for change", false)
  .action(async (opts: BuildOpts) => {
    new BuildAction(opts.watch, opts.clean, await getCurrentDir()).run()
  })

interface ServeOpts {
  clean: boolean
}

program.command("serve")
  .description("build and serve notes")
  .option(cleanOpt[0], cleanOpt[1])
  .action(async (opts: ServeOpts) => {
    new ServeAction(opts.clean, await getCurrentDir()).run()
  })

program.command("list")
  .description("list notes")
  .action(async () => {
    const dir = await getCurrentDir()
    await printListNotes(dir)
  })

program.command("new")
  .description("create new note")
  .arguments("<path>")
  .action(async (path: string) => {
    console.log(`Creating note with name ${path}`)
    const dir = await getCurrentDir()
    await newNote(dir, path)
  })

program.command("rename")
  .description("rename note")
  .arguments("<old-id> <new-id>")
  .action(async (oldId: string, newId: string) => {
    const dir = await getCurrentDir()
    await renameNote(dir, oldId, newId)
  })

program.parseAsync(process.argv)

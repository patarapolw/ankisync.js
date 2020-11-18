import { spawnSync } from 'child_process'
import path from 'path'

console.log(
  path.join(
    '/mnt',
    spawnSync('cmd.exe', ['/c', 'echo', '%APPDATA%'])
      .stdout.toString()
      .trim()
      .replace(/^(\S+):/, (_, p: string) => p.toLocaleLowerCase())
      .replace(/\\/g, '/')
  )
)

import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Most reliable way is to go to
 *
 * Tools >> Add-ons >> View Files
 */
export function getAnkiPath(user: string) {
  const root = () => {
    switch (os.platform()) {
      case 'linux':
        if (fs.readFileSync('/proc/version', 'utf8').includes('microsoft')) {
          return path.join(
            '/mnt',
            spawnSync('cmd.exe', ['/c', 'echo', '%APPDATA%'])
              .stdout.toString()
              .trim()
              .replace(/^(\S+):/, (_, p: string) => p.toLocaleLowerCase())
              .replace(/\\/g, '/')
          )
        }
        break
      case 'win32':
        return process.env.APPDATA!
      case 'darwin':
        return path.join(process.env.HOME!, 'Library/Application Support')
    }

    return path.join(process.env.HOME!, '.local/share')
  }
  return path.join(root(), 'Anki2', user)
}

/**
 * Get User's `collection.anki2`
 */
export function getAnkiCollection(user: string) {
  return path.join(getAnkiPath(user), 'collection.anki2')
}

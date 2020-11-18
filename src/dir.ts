import os from 'os'
import path from 'path'

/**
 * Most reliable way is to go to
 *
 * Tools >> Add-ons >> View Files
 */
export function getAnkiPath(user: string) {
  const root =
    ({
      win32: process.env.APPDATA!,
      darwin: path.join(process.env.HOME!, 'Library/Application Support')
    } as Record<string, string>)[os.platform()] ||
    path.join(process.env.HOME!, '.local/share')

  return path.join(root, 'Anki2', user)
}

/**
 * Get User's `collection.anki2`
 */
export function getAnkiCollection(user: string) {
  return path.join(getAnkiPath(user), 'collection.anki2')
}

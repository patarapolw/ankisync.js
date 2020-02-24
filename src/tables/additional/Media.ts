import crypto from 'crypto'

import { prop, Entity, Table, primary } from 'liteorm'

@Entity({ name: 'media' })
class AnkiMedia {
  @primary({ autoincrement: true }) id?: number

  @prop({
    default: ({ data }) => crypto.createHash('sha256').update(data).digest('base64'),
    onUpdate: ({ data }) => data ? crypto.createHash('sha256').update(data).digest('base64') : undefined
  }) h?: string

  @prop() name!: string
  @prop() data!: ArrayBuffer
}

export const ankiMedia = new Table(AnkiMedia)

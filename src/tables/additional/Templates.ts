import { prop, Entity, Table } from 'liteorm'
import { ankiModels } from './Models'

@Entity({ name: 'templates' })
class AnkiTemplates {
  @prop({ type: 'int', references: ankiModels }) mid!: number
  @prop({ type: 'int' }) ord!: number
  @prop() name!: string
  @prop() qfmt!: string
  @prop({ null: true }) afmt?: string
}

export const ankiTemplates = new Table(AnkiTemplates)

import { prop, Entity, Table } from 'liteorm'
import { dbModels } from './Models'

@Entity({ name: 'templates' })
class DbTemplates {
  @prop({ type: 'int', references: dbModels }) mid!: number
  @prop({ type: 'int' }) ord!: number
  @prop() name!: string
  @prop() qfmt!: string
  @prop({ null: true }) afmt?: string
}

export const dbTemplates = new Table(DbTemplates)

import { primary, prop, Entity, Table } from 'liteorm'

@Entity({ name: 'graves' })
class DbGraves {
  @primary({ autoincrement: true }) id?: number
  @prop({ type: 'int', default: -1 }) usn?: number
  @prop({ type: 'int', default: 1540966406171 }) oid?: number
  @prop({ type: 'int', default: 0 }) type?: number
}

export const dbGraves = new Table(DbGraves)

import { prop, Entity, Table, primary } from 'liteorm'
import SparkMD5 from 'spark-md5'

@Entity({ name: 'media' })
class DbMedia {
  @primary({ autoincrement: true }) id?: number

  @prop({
    default: ({ data }) => SparkMD5.ArrayBuffer.hash(data),
    onUpdate: ({ data }) => data ? SparkMD5.ArrayBuffer.hash(data) : undefined
  }) h?: string

  @prop() name!: string
  @prop() data!: ArrayBuffer
}

export const dbMedia = new Table(DbMedia)

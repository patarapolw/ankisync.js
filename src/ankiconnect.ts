import axios from 'axios'

interface IDefault {
  [k: string]: {
    payload?: unknown
    result: unknown
  }
}

interface IModel extends IDefault {
  modelNamesAndIds: {
    result: {
      [modelName: string]: number
    }
  }
}

interface INote extends IDefault {
  findNotes: {
    payload: {
      query: string
    }
    result: string[]
  }
  notesInfo: {
    payload: {
      notes: string[]
    }
    result: {
      fields: Record<
        string,
        {
          ord: number
          value: string
        }
      >
    }[]
  }
  addNote: {
    payload: {
      note: {
        deckName: string
        modelName: string
        fields: Record<string, string>
      }
    }
    result: string[]
  }
}

type IAnkiconnect = IModel & INote

export const ankiconnect = {
  api: axios.create({
    baseURL: 'http://127.0.0.1:8765'
  }),
  async invoke<K extends keyof IAnkiconnect>(
    action: K,
    params: IAnkiconnect[K]['payload'] = {},
    version = 6
  ): Promise<IAnkiconnect[K]['result']> {
    const {
      data: { result, error }
    } = await this.api.post('/', { action, version, params })

    if (error) {
      throw new Error(error)
    }

    return result
  }
}

export async function mapAsync<T, R = T>(
  arr: T[],
  cb: (el: T, i: number, a0: T[]) => Promise<R>
): Promise<R[]> {
  return Promise.all(
    arr.map(async (el, i, a0) => {
      return await cb(el, i, a0)
    })
  )
}

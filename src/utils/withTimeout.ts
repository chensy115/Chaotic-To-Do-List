export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = '请求超时，请检查网络连接'
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new Error(message))
      }
    }, ms)
    promise.then(
      (value) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(value)
        }
      },
      (error) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(error)
        }
      }
    )
  })
}

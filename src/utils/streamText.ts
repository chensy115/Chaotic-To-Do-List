let abortCurrent: (() => void) | null = null

/** 本地假流式：逐字输出，新请求会取消上一段 */
export function streamText(
  text: string,
  onChunk: (partial: string) => void,
  msPerChar = 35
): Promise<void> {
  abortCurrent?.()

  return new Promise((resolve) => {
    let i = 0
    const timer = setInterval(() => {
      i += 1
      onChunk(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        abortCurrent = null
        resolve()
      }
    }, msPerChar)

    abortCurrent = () => {
      clearInterval(timer)
      abortCurrent = null
      resolve()
    }
  })
}

export function cancelStreamText() {
  abortCurrent?.()
}

/** 将 DOM 节点渲染为 PNG Blob（html2canvas 按需加载） */
export async function renderElementToPng(element: HTMLElement): Promise<Blob | null> {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#0a0a0f',
    logging: false,
    useCORS: true,
  })
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

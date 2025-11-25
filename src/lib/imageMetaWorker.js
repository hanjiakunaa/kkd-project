/* eslint-disable no-restricted-globals */
self.onmessage = async (event) => {
  const { id, file } = event.data || {}
  console.log('imageMetaWorker', id, file)
  if (!id || !file) {
    self.postMessage({ id, width: 0, height: 0 })
    return
  }
  try {
    const bitmap = await createImageBitmap(file)
    self.postMessage({ id, width: bitmap.width, height: bitmap.height })
    bitmap.close()
  }
  catch (error) {
    console.error('[imageMetaWorker]', error)
    self.postMessage({ id, width: 0, height: 0 })
  }
}

/** Shrink a phone photo to at most `max` px on its long side as JPEG, returned as base64. */
export async function compressImage(file: File, max = 1600, quality = 0.82): Promise<{ type: string; data: string; preview: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const preview = canvas.toDataURL('image/jpeg', quality)
  return { type: 'image/jpeg', data: preview.split(',')[1], preview }
}

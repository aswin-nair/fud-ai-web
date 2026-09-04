/** Validate selection without reading or uploading the file. */
export function photoFileIssue(file: Pick<File, 'type' | 'size'>): string | null {
  if (!file.type.startsWith('image/')) return 'Choose an image file, or log the meal manually.'
  if (file.size === 0) return 'This image is empty. Choose another photo.'
  if (file.size > 15 * 1024 * 1024) return 'That image is larger than 15 MB. Choose a smaller image or log manually.'
  return null
}

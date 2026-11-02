export const malformed = <T>(value: unknown) => value as T

export const validImage = {
  alt: 'Rows of amber lights',
  hotspot: { x: 0.5, y: 0.4, width: 0.6, height: 0.5 },
  crop: { top: 0, bottom: 0.1, left: 0, right: 0 },
  asset: {
    _id: 'image-abc123-1600x1000-png',
    metadata: { lqip: 'data:image/jpeg;base64,xyz', dimensions: { width: 1600, height: 1000 } },
  },
}

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

export function generateShareToken(length = 22): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += BASE62[bytes[i] % BASE62.length]
  }
  return out
}

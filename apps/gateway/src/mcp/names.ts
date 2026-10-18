export const prefixed = (server: string, tool: string) => `${server}__${tool}`
export function split(full: string) {
  const at = full.indexOf("__")
  return at < 1 ? null : { server: full.slice(0, at), tool: full.slice(at + 2) }
}

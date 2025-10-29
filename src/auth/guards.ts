
export function requireRoles(roles: string[]) {
  return (req:any, res:any, next:any) => {
    const tokenRoles = new Set((payloadRoles((req as any).user)))
    const ok = roles.every(r => tokenRoles.has(r))
    return ok ? next() : res.status(403).json({ error: "insufficient_role" })
  }
}

function payloadRoles(payload:any){
  return payload?.realm_access?.roles ?? []
}
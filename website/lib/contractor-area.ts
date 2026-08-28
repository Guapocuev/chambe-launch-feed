export function isContractorArea(pathname: string): boolean {
  return pathname === '/contractor' || pathname.startsWith('/contractor/');
}

export function isApprenticeArea(pathname: string): boolean {
  return pathname === '/apprentice' || pathname.startsWith('/apprentice/');
}

export function isAppArea(pathname: string): boolean {
  return isContractorArea(pathname) || isApprenticeArea(pathname);
}

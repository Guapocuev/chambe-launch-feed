export function isContractorArea(pathname: string): boolean {
  return pathname === '/contractor' || pathname.startsWith('/contractor/');
}

export function isApprenticeArea(pathname: string): boolean {
  return pathname === '/apprentice' || pathname.startsWith('/apprentice/');
}

export function isVisualizeArea(pathname: string): boolean {
  return pathname === '/visualize' || pathname.startsWith('/visualize/');
}

export function isAppArea(pathname: string): boolean {
  return isContractorArea(pathname) || isApprenticeArea(pathname) || isVisualizeArea(pathname);
}

export const getInitials = (name?: string, email?: string) => {
  const source = name?.trim() || email?.trim() || "U";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

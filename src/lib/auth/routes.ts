export const getAuthRedirect = (pathname: string, isAuthenticated: boolean) => {
  if (pathname.startsWith("/app") && !isAuthenticated) {
    return `/sign-in?next=${encodeURIComponent(pathname)}`;
  }

  if (pathname === "/sign-in" && isAuthenticated) {
    return "/app";
  }

  return null;
};

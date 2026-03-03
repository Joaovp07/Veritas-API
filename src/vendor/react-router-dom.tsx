import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type RouterValue = {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterValue | undefined>(undefined);

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname || "/");

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState({}, "", to);
    } else {
      window.history.pushState({}, "", to);
    }
    setPath(to);
  };

  const value = useMemo(() => ({ path, navigate }), [path]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function Routes({ children }: { children: ReactNode }) {
  const router = useContext(RouterContext);
  if (!router) return null;

  const elements = Array.isArray(children) ? children : [children];
  const matched = elements.find((child) => {
    const childPath = (child as { props?: { path?: string } })?.props?.path;
    if (!childPath) return false;
    if (childPath === "*") return true;
    return childPath === router.path;
  });

  return matched ?? null;
}

export function Route({ element }: { path: string; element: ReactNode }) {
  return <>{element}</>;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useContext(RouterContext);
  useEffect(() => {
    router?.navigate(to, { replace });
  }, [router, to, replace]);
  return null;
}

export function useNavigate() {
  const router = useContext(RouterContext);
  if (!router) throw new Error("Router não encontrado");
  return router.navigate;
}

export function Link({ to, children }: { to: string; children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

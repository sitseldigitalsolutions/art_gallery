import { AnimatePresence, motion } from "motion/react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { cartApi } from "@/features/cart/api";
import { notificationsApi } from "@/features/account/api";
import { useSiteConfig } from "@/features/site/SiteConfigContext";
import { AnnouncementBar } from "./AnnouncementBar";

export function Logo({
  light = true,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  const { config } = useSiteConfig();
  const { siteName, scriptLogo } = config.branding;
  // "MyMoons Gallery" → script "MyMoons" + small-caps "Gallery"; single words render whole.
  const words = siteName.trim().split(/\s+/);
  const main = words.length > 1 ? words.slice(0, -1).join(" ") : siteName;
  const suffix = words.length > 1 ? words[words.length - 1] : "";
  return (
    <Link
      to="/"
      className={clsx("group inline-flex items-baseline gap-1.5", className)}
      aria-label={`${siteName} home`}
    >
      <span
        className={clsx(
          "leading-none transition group-hover:text-gradient",
          scriptLogo
            ? "font-script text-3xl"
            : "text-xl font-bold tracking-tight",
          light ? "text-white" : "text-ink",
        )}
      >
        {main}
      </span>
      {suffix && (
        <span
          className={clsx(
            "text-[10px] font-semibold uppercase tracking-[0.35em]",
            light ? "text-white/70" : "text-gray-500",
          )}
        >
          {suffix}
        </span>
      )}
    </Link>
  );
}

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/gallery", label: "Gallery" },
  { to: "/categories", label: "Category" },
  { to: "/artists", label: "Artists" },
  { to: "/collections", label: "Collections" },
  { to: "/about", label: "About Us" },
];

export function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  // Transparent over dark heroes; most public pages start with one.
  const overHero = !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname]);

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: !!user,
  });
  const unread = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.unread,
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const dashboard = hasRole("ADMIN")
    ? "/admin"
    : hasRole("ARTIST")
      ? "/seller"
      : null;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />
      <div
        className={clsx(
          "transition-all duration-500",
          overHero
            ? "bg-gradient-to-b from-black/50 to-transparent py-5"
            : "bg-ink/85 py-3 shadow-lg shadow-black/20 backdrop-blur-xl",
        )}
      >
        <div className="container-x flex items-center justify-between gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  clsx(
                    "relative rounded-full px-3 py-1.5 text-sm font-medium transition",
                    isActive ? "text-white" : "text-white/70 hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/wishlist"
                  aria-label="Wishlist"
                  className="hidden h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white sm:grid"
                >
                  <Heart size={18} />
                </Link>
                <Link
                  to="/account?tab=notifications"
                  aria-label="Notifications"
                  className="relative hidden h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white sm:grid"
                >
                  <Bell size={18} />
                  {!!unread.data?.count && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-magenta px-1 text-[9px] font-bold text-white">
                      {unread.data.count > 9 ? "9+" : unread.data.count}
                    </span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  aria-label="Cart"
                  className="relative grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <ShoppingBag size={18} />
                  {!!cart.data?.itemCount && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                      {cart.data.itemCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenu((m) => !m)}
                    aria-haspopup="menu"
                    aria-expanded={menu}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    <User size={17} />
                    <span className="sr-only">Account menu</span>
                  </button>
                  <AnimatePresence>
                    {menu && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl bg-white p-2 text-sm text-ink shadow-2xl"
                      >
                        <div className="px-3 py-2">
                          <p className="truncate font-semibold">
                            {user.fullName}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                        <hr className="my-1 border-gray-100" />
                        {dashboard && (
                          <Link
                            role="menuitem"
                            to={dashboard}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-brand-light"
                          >
                            <LayoutDashboard size={15} /> Dashboard
                          </Link>
                        )}
                        <Link
                          role="menuitem"
                          to="/account"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-brand-light"
                        >
                          <User size={15} /> My account
                        </Link>
                        <Link
                          role="menuitem"
                          to="/account/orders"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-brand-light"
                        >
                          <ShoppingBag size={15} /> Orders
                        </Link>
                        <Link
                          role="menuitem"
                          to="/account/custom-art"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-brand-light"
                        >
                          <Sparkles size={15} /> My custom art
                        </Link>
                        <button
                          role="menuitem"
                          onClick={async () => {
                            await logout();
                            navigate("/");
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <span className="hidden text-sm text-white/80 sm:inline">
                <Link to="/login" className="hover:text-white">
                  Login
                </Link>
                <span className="mx-2 text-white/40">|</span>
                <Link to="/register" className="hover:text-white">
                  Sign Up
                </Link>
              </span>
            )}
            <Link
              to="/create-your-art"
              className="btn-brand hidden !py-2 md:inline-flex"
            >
              <Sparkles size={15} /> Create Your Art
            </Link>
            <button
              className="grid h-10 w-10 place-items-center rounded-full text-white lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-ink p-6 text-white"
              aria-label="Mobile menu"
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo />
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {LINKS.map((l, i) => (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <NavLink
                      to={l.to}
                      end={l.end}
                      className={({ isActive }) =>
                        clsx(
                          "block rounded-xl px-4 py-3 text-lg",
                          isActive ? "bg-brand" : "hover:bg-white/10",
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <Link to="/create-your-art" className="btn-brand">
                  <Sparkles size={16} /> Create Your Art
                </Link>
                {!user && (
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login" className="btn-ghost">
                      Login
                    </Link>
                    <Link to="/register" className="btn-ghost">
                      Sign Up
                    </Link>
                  </div>
                )}
                {dashboard && (
                  <Link to={dashboard} className="btn-ghost">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

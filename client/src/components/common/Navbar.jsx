import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Sun, Moon, User, LogOut, Settings, ChevronDown,
  Bell, Menu, X, LayoutDashboard, FileText, Brain, Briefcase
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import { initials, cn, formatRelativeTime } from '@/lib/utils';

const Navbar = () => {
  const { theme, toggle } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = isAuthenticated
    ? user?.role === 'student' ? [
        { to: '/student/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/resume',     label: 'Resume',    icon: FileText },
        { to: '/student/test',       label: 'Assessment',icon: Brain },
        { to: '/student/internships',label: 'Internships',icon: Briefcase },
      ]
    : user?.role === 'admin' ? [
        { to: '/admin/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users',        label: 'Users',     icon: User },
        { to: '/admin/internships',  label: 'Internships',icon: Briefcase },
      ]
    : []
    : [];

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm dark:shadow-card-dark'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-foreground">
              Intern<span className="gradient-text">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {navLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand-500/15 text-brand-500 dark:text-brand-400'
                      : 'text-muted hover:text-foreground hover:bg-subtle'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              id="theme-toggle"
              onClick={toggle}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-subtle transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification bell & dropdown */}
                <div className="relative">
                  <button
                    id="notif-btn"
                    onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-subtle transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-[9999]"
                        style={{
                          background: 'var(--surface-card)',
                          border: '1px solid var(--surface-border)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
                          color: 'var(--surface-text)',
                        }}
                      >
                        <div
                          className="px-4 py-3 flex items-center justify-between"
                          style={{ borderBottom: '1px solid var(--surface-border)' }}
                        >
                          <span
                            className="font-semibold text-sm"
                            style={{ color: 'var(--surface-text)' }}
                          >Notifications</span>
                          <div className="flex items-center gap-2">
                            {notifications.some(n => !n.read) && (
                              <button
                                onClick={markAllAsRead}
                                className="text-xs text-brand-500 hover:text-brand-600 font-semibold"
                              >
                                Mark all read
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <>
                                {notifications.some(n => !n.read) && <span className="text-[10px] text-border/60">|</span>}
                                <button
                                  onClick={clearAll}
                                  className="text-xs text-danger-500 hover:text-danger-600 font-semibold"
                                >
                                  Clear all
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-1.5" style={{ borderTop: 'none' }}>
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs" style={{ color: 'var(--surface-muted)' }}>No notifications</div>
                          ) : (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  markAsRead(n.id);
                                  if (n.link) navigate(n.link);
                                  setNotifOpen(false);
                                }}
                                className={cn(
                                  "p-3 rounded-xl cursor-pointer text-left transition-all hover:bg-subtle flex flex-col gap-0.5",
                                  !n.read && "bg-brand-500/[0.03]"
                                )}
                                style={{ color: 'var(--surface-text)' }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className={cn("text-xs font-semibold", !n.read ? "text-brand-500" : "")} style={{ color: !n.read ? '' : 'var(--surface-text)' }}>
                                    {n.title}
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--surface-muted)' }}>{formatRelativeTime(n.createdAt)}</span>
                                </div>
                                <p className="text-xs leading-snug" style={{ color: 'var(--surface-muted)' }}>{n.description}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    id="user-menu-btn"
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-subtle transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                      {initials(user?.name)}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-muted transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-[9999]"
                        style={{
                          background: 'var(--surface-card)',
                          border: '1px solid var(--surface-border)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
                        }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--surface-text)' }}>{user?.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--surface-muted)' }}>{user?.email}</p>
                        </div>
                        <div className="p-1.5">
                          <DropdownItem icon={User}     label="My Profile"   to="/profile" onClick={() => setDropdownOpen(false)} />
                          <div className="my-1 border-t border-border" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-danger-500 hover:bg-danger-500/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all hover:shadow-glow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-subtle transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'bg-brand-500/15 text-brand-500 dark:text-brand-400' : 'text-muted hover:text-foreground hover:bg-subtle'
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <div className="pt-3 border-t border-border flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-center text-sm font-medium text-muted hover:text-foreground border border-border hover:bg-subtle rounded-xl">Sign in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-center text-sm font-semibold bg-brand-500 text-white rounded-xl">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const DropdownItem = ({ icon: Icon, label, to, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground hover:bg-subtle transition-all"
  >
    <Icon className="w-4 h-4" />
    {label}
  </Link>
);

export default Navbar;

import { cn } from '@/lib/utils';
import { forwardRef, createContext, useContext } from 'react';

// ─── Button ───────────────────────────────────────────────────
const variants = {
  primary:  'bg-brand-500 hover:bg-brand-600 text-white shadow-glow-sm hover:shadow-glow-md',
  secondary:'bg-subtle hover:bg-muted/10 text-foreground border border-border',
  outline:  'border border-brand-500 text-brand-500 hover:bg-brand-500/10',
  ghost:    'text-muted hover:text-foreground hover:bg-subtle',
  danger:   'bg-danger-500 hover:bg-danger-600 text-white',
  success:  'bg-success-500 hover:bg-success-600 text-white',
};

const sizes = {
  sm:  'px-3 py-1.5 text-sm rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3 text-base rounded-xl',
  xl:  'px-8 py-4 text-base rounded-2xl',
  icon:'w-9 h-9 p-0 rounded-xl',
};

export const Button = forwardRef(
  ({ variant = 'primary', size = 'md', className, disabled, loading, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Card ─────────────────────────────────────────────────────
export const Card = ({ className, children, hover = false, glow = false, ...props }) => (
  <div
    className={cn(
      'bg-card border border-border rounded-2xl',
      hover && 'hover:border-brand-500/30 hover:shadow-glow-sm transition-all duration-300 cursor-pointer',
      glow && 'shadow-glow-sm',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className, children }) => (
  <div className={cn('px-6 py-5 border-b border-border', className)}>{children}</div>
);

export const CardBody = ({ className, children }) => (
  <div className={cn('px-6 py-5', className)}>{children}</div>
);

// ─── Badge ────────────────────────────────────────────────────
const badgeVariants = {
  brand:   'bg-brand-500/15 text-brand-400 border border-brand-500/20',
  success: 'bg-success-500/15 text-success-500 border border-success-500/20',
  warning: 'bg-warning-500/15 text-warning-500 border border-warning-500/20',
  danger:  'bg-danger-500/15 text-danger-500 border border-danger-500/20',
  neutral: 'bg-subtle text-muted border border-border',
};

export const Badge = ({ variant = 'neutral', className, children }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg',
    badgeVariants[variant],
    className
  )}>
    {children}
  </span>
);

// ─── Input ────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, icon: Icon, className, id, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full px-4 py-3 bg-subtle border border-border rounded-xl',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50',
          'transition-all duration-200',
          Icon && 'pl-10',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/50',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-danger-500 flex items-center gap-1">{error}</p>}
  </div>
));
Input.displayName = 'Input';

// ─── Progress Bar ─────────────────────────────────────────────
export const Progress = ({ value = 0, max = 100, color = 'brand', className, showLabel }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    brand:   'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger:  'bg-danger-500',
  };
  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-surface-muted">
          <span>Progress</span><span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 bg-subtle rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────
export const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton', className)} {...props} />
);

// ─── Label ────────────────────────────────────────────────────
export const Label = forwardRef(({ className, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'block text-sm font-semibold leading-none text-foreground',
      className
    )}
    {...props}
  >
    {children}
  </label>
));
Label.displayName = 'Label';

// ─── Dialog ───────────────────────────────────────────────────
const DialogContext = createContext({ open: false, onOpenChange: () => {} });

export const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogContent = forwardRef(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = useContext(DialogContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Modal Card */}
      <div 
        ref={ref}
        className={cn(
          'relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-xl transition-all text-foreground',
          className
        )}
        {...props}
      >
        {/* Close Button */}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <svg className="h-4 w-4 text-surface-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
});
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props}>
    {children}
  </div>
);
DialogHeader.displayName = 'DialogHeader';

export const DialogTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)} {...props}>
    {children}
  </h3>
);
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-surface-muted', className)} {...props}>
    {children}
  </p>
);
DialogDescription.displayName = 'DialogDescription';

export const DialogFooter = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6', className)} {...props}>
    {children}
  </div>
);
DialogFooter.displayName = 'DialogFooter';

export default { Button, Card, CardHeader, CardBody, Badge, Input, Progress, Skeleton, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };

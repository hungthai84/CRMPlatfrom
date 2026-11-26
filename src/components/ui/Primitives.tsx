import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Inbox,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1951fc]/40';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[34px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
  };
  const variants = {
    primary: 'bg-[#1951fc] text-white hover:bg-[#1443d6]',
    secondary: 'bg-[#102a56] text-white hover:bg-[#0b1730] dark:bg-slate-800 dark:hover:bg-slate-700',
    outline:
      'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
    ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({
  label,
  error,
  className,
  ...props
}) => (
  <label className="block w-full">
    {label && (
      <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {props.required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
    )}
    <input
      className={cn(
        'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1951fc]/30 focus:border-[#1951fc]',
        error && 'border-rose-500',
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-rose-600 mt-1 block">{error}</span>}
  </label>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({
  label,
  className,
  children,
  ...props
}) => (
  <label className="block w-full">
    {label && (
      <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {props.required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
    )}
    <select
      className={cn(
        'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1951fc]/30 focus:border-[#1951fc]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  </label>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({
  label,
  className,
  ...props
}) => (
  <label className="block w-full">
    {label && (
      <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {props.required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
    )}
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1951fc]/30 focus:border-[#1951fc]',
        className
      )}
      {...props}
    />
  </label>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, size = 'md', children }) => {
  if (!open) return null;
  const maxWidths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className={cn(
          'w-full bg-white dark:bg-[#0f2142] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
          maxWidths[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, description, confirmLabel = 'Xác nhận', variant = 'danger', onConfirm, onCancel }) => (
  <Modal open={open} onClose={onCancel} title={title} size="md">
    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
    <div className="flex justify-end gap-3 mt-6">
      <Button variant="outline" onClick={onCancel}>
        Hủy bỏ
      </Button>
      <Button variant={variant} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export const StatusLabel: React.FC<{
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  text: string;
}> = ({ tone, text }) => {
  const styles = {
    success: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    danger: 'text-rose-700 dark:text-rose-400',
    info: 'text-[#1951fc] dark:text-[#22c7e8]',
    neutral: 'text-slate-600 dark:text-slate-400',
  };
  const icons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
    warning: <Clock className="w-3.5 h-3.5 shrink-0" />,
    danger: <XCircle className="w-3.5 h-3.5 shrink-0" />,
    info: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
    neutral: <Clock className="w-3.5 h-3.5 shrink-0" />,
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap', styles[tone])}>
      {icons[tone]}
      <span>{text}</span>
    </span>
  );
};

export const KpiCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'cyan' | 'green' | 'amber' | 'purple' | 'rose';
}> = ({ label, value, hint, icon, accent = 'blue' }) => {
  const iconWrap = {
    blue: 'bg-[#1951fc]/10 text-[#1951fc] dark:text-[#22c7e8]',
    cyan: 'bg-[#22c7e8]/15 text-cyan-700 dark:text-cyan-300',
    green: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
    purple: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
    rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
  }[accent];

  return (
    <div className="glass-card rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums tracking-tight">
          {value}
        </p>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{hint}</p>}
      </div>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconWrap)}>{icon}</div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="glass-card rounded-xl p-10 text-center flex flex-col items-center justify-center">
    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
      <Inbox className="w-5 h-5" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const PermissionDeniedState: React.FC<{ moduleName: string }> = ({ moduleName }) => (
  <div className="glass-card rounded-xl p-10 text-center flex flex-col items-center justify-center">
    <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
      <ShieldAlert className="w-5 h-5" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
      Không có quyền truy cập phân hệ {moduleName}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
      Vai trò hiện tại của bạn không được cấp quyền xem dữ liệu tại phân hệ này. Vui lòng liên hệ Quản trị viên tổ chức.
    </p>
  </div>
);

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="glass-card rounded-xl p-4 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-9 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
    ))}
  </div>
);

export const PaginationBar: React.FC<{
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}> = ({ page, totalPages, totalItems, onPageChange }) => {
  if (totalItems === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500 dark:text-slate-400">
      <span className="tabular-nums">
        Hiển thị trang {page} / {Math.max(1, totalPages)} · Tổng {totalItems} bản ghi
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

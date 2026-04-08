import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:bg-blue-400',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 disabled:bg-gray-50',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 disabled:opacity-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:bg-red-400',
  outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;

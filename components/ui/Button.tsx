import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   variant?: ButtonVariant;
   size?: ButtonSize;
   fullWidth?: boolean;
   className?: string;
}

const Button = ({
   variant = 'primary',
   size = 'md',
   fullWidth = false,
   className = '',
   children,
   ...props
}: ButtonProps) => {
   const classes = ['btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--full-width', className]
      .filter(Boolean)
      .join(' ');

   return (
      <button type="button" className={classes} {...props}>
         {children}
      </button>
   );
};

export default Button;

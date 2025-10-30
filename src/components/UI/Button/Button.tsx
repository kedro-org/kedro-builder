import { forwardRef } from 'react';
import classNames from 'classnames';
import './Button.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={classNames(
          'kedro-button',
          `kedro-button--${variant}`,
          `kedro-button--${size}`,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

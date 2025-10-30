import { forwardRef } from 'react';
import classNames from 'classnames';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className={classNames('kedro-input-wrapper', className)}>
        {label && (
          <label htmlFor={props.id} className="kedro-input__label">
            {label}
            {props.required && <span className="kedro-input__required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={classNames('kedro-input', {
            'kedro-input--error': error,
          })}
          {...props}
        />
        {error && <span className="kedro-input__error">{error}</span>}
        {helperText && !error && <span className="kedro-input__helper">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

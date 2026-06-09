import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

interface InputFieldProps {
    label: string;
    type?: 'text' | 'password';
    placeholder: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    icon: ReactNode;
}

function InputField({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    icon,
}: InputFieldProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="login-input-group">
            <label className="login-input-label">{label}</label>

            <div className="login-input-wrapper">
                <span className="login-input-leading-icon" aria-hidden="true">
                    {icon}
                </span>

                <input
                    className="login-input-element"
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />

                {isPassword && (
                    <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                        <svg viewBox="0 0 24 24" fill="none">
                            <path
                                d="M2 12C3.7 7.8 7.3 5 12 5C16.7 5 20.3 7.8 22 12C20.3 16.2 16.7 19 12 19C7.3 19 3.7 16.2 2 12Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export default InputField;

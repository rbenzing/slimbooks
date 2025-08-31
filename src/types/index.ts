// Central export file for all TypeScript types and interfaces

// Re-export all domain-specific types
export * from './auth';
export * from './invoice.types';
export * from './client.types';
export * from './expense.types';
export * from './payment.types';
export * from './common.types';
export * from './ui.types';

// Type utilities for better TypeScript experience
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Generic utility types
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Record types for common patterns
export type StringRecord = Record<string, string>;
export type NumberRecord = Record<string, number>;
export type BooleanRecord = Record<string, boolean>;
export type UnknownRecord = Record<string, unknown>;

// Function types
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>;
export type EventHandler<T = Event> = (event: T) => void;

// Form and validation types
export type ValidationRule<T> = (value: T) => string | undefined;
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export type FieldError = {
  message: string;
  type: string;
};

export type FieldErrors<T> = {
  [K in keyof T]?: FieldError;
};

// API and service types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

// State management types
export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingStatus;
  error: string | null;
}

// Component prop types
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type ComponentColor = 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';

// Event types
export type ClickEvent = React.MouseEvent<HTMLElement>;
export type ChangeEvent<T = HTMLInputElement> = React.ChangeEvent<T>;
export type FormEvent = React.FormEvent<HTMLFormElement>;
export type KeyboardEvent = React.KeyboardEvent<HTMLElement>;

// Ref types
export type ElementRef<T = HTMLElement> = React.RefObject<T>;
export type CallbackRef<T = HTMLElement> = React.Ref<T>;

// Children types
export type Children = React.ReactNode;
export type ChildrenFunction<T> = (props: T) => React.ReactNode;

// Style types
export type CSSProperties = React.CSSProperties;
export type ClassName = string | undefined;

// Generic array and object types
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
export type ObjectValues<T> = T[keyof T];
export type ObjectKeys<T> = keyof T;

// Conditional types
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Brand types for type safety
export type Brand<T, B> = T & { readonly __brand: B };

// ID types
export type ID = Brand<number, 'ID'>;
export type UUID = Brand<string, 'UUID'>;

// Date and time types
export type ISOString = Brand<string, 'ISOString'>;
export type DateString = Brand<string, 'DateString'>;
export type TimeString = Brand<string, 'TimeString'>;

// Currency and numeric types
export type Currency = Brand<number, 'Currency'>;
export type Percentage = Brand<number, 'Percentage'>;
export type PositiveNumber = Brand<number, 'PositiveNumber'>;

// URL and file types
export type URLString = Brand<string, 'URL'>;
export type EmailString = Brand<string, 'Email'>;
export type PhoneString = Brand<string, 'Phone'>;
export type FileSize = Brand<number, 'FileSize'>;
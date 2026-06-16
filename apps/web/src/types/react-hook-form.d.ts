declare module 'react-hook-form' {
  type FieldValues = Record<string, unknown>;
  type FieldError = { type: string; message?: string };
  type FieldErrors<T extends FieldValues> = Partial<Record<keyof T, FieldError>>;

  interface RegisterOptions<T extends FieldValues> {
    required?: boolean | string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    validate?: (value: unknown) => boolean | string | Promise<boolean | string>;
  }

  interface UseFormReturn<T extends FieldValues> {
    register: (name: keyof T, options?: RegisterOptions<T>) => {
      onChange: (e: unknown) => void;
      onBlur: (e: unknown) => void;
      ref: (e: unknown) => void;
      name: keyof T;
    };
    handleSubmit: (onValid: (data: T) => void, onInvalid?: (errors: FieldErrors<T>) => void) => (e?: unknown) => void;
    watch: (name?: keyof T) => unknown;
    reset: (values?: T) => void;
    setValue: (name: keyof T, value: unknown) => void;
    formState: { errors: FieldErrors<T>; isSubmitting: boolean; isDirty: boolean };
    control: unknown;
  }

  export function useForm<T extends FieldValues = FieldValues>(options?: {
    resolver?: unknown;
    defaultValues?: Partial<T>;
    values?: T;
  }): UseFormReturn<T>;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: unknown): (data: unknown) => { values: unknown; errors: unknown };
}

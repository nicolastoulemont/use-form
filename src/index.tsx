import { useState } from 'react';

export interface ValidationConfig {
  onSubmit?: Array<Function>;
  onChange?: Array<Function>;
  onBlur?: Array<Function>;
}

export interface Field {
  name: string;
  validation?: ValidationConfig | undefined;
}

export interface EventInfos {
  name: string;
  value: any;
}

export function useForm(state: { [key: string]: any } = {}) {
  const [values, setValues] = useState<{ [key: string]: any }>(state);
  const [errors, setErrors] = useState<{ [key: string]: any }>({});
  const [hasSubmit, setHasSubmit] = useState<boolean>(false);

  // Shared
  function runFns(fns: Array<Function>, value: any): undefined | any {
    if (!fns || fns.length === 0) {
      return undefined;
    }

    // Return the first error its find
    let err: undefined = undefined;
    fns.forEach(fn => {
      if (typeof err === 'undefined' && typeof fn === 'function') {
        err = fn(value);
      }
    });
    return err;
  }

  function getFns(validation: ValidationConfig | undefined): Array<Function> {
    let fns: Array<Function> = [];
    if (validation?.onChange) {
      fns = [...validation.onChange];
    }
    if (validation?.onBlur) {
      fns = [...fns, ...validation.onBlur];
    }
    if (validation?.onSubmit) {
      fns = [...fns, ...validation.onSubmit];
    }
    return fns;
  }

  // On Change
  function onChange(
    infos: EventInfos,
    validation: ValidationConfig | undefined
  ) {
    hasSubmit && setHasSubmit(false);
    const { name, value } = infos;
    // Remove field error on change
    if (errors[name]) setErrors({ ...errors, [name]: undefined });

    // Set values in state
    setValues({
      ...values,
      [name]: value,
    });

    // If onChange validation, run it
    if (validation?.onChange) {
      setErrors({
        ...errors,
        [name]: runFns(validation.onChange, value),
      });
    }
  }

  function onBlur(infos: EventInfos, validation: ValidationConfig | undefined) {
    const { name, value } = infos;

    if (validation?.onBlur) {
      setErrors({
        ...errors,
        [name]: runFns(validation.onBlur, value),
      });
    }
  }

  // On Submit validation
  function onSubmit(fields: Array<Field>) {
    setHasSubmit(true);

    let count = 0;
    let submitErrors: { [key: string]: any } = {};

    fields.forEach(field => {
      if (field.validation) {
        /* Reconcile onChange and onSubmit validations: 
        onChange validation is also run on onSubmit */
        const fns = getFns(field.validation);

        /* Build the submitErrors object in order to update the state later */
        const errors = runFns(fns, values[field.name]);
        submitErrors[field.name] = errors;
        // Increment errors to get the count
        if (errors) {
          count++;
        }
      }
    });

    // Update errors state
    setErrors(submitErrors);

    // Return the form valid status: true / false, and the form error count
    return [count === 0, count];
  }

  function deleteVal(key: string) {
    setValues(values => ({ ...values, [key]: undefined }));
  }

  function deleteErr(key: string) {
    setErrors(errors => ({
      ...errors,
      [key]: undefined,
    }));
  }

  const resetValues = () => setValues({});
  const resetErrors = () => setErrors({});

  function resetForm() {
    setErrors({});
    setValues({});
  }

  return {
    values,
    setValues,
    errors,
    setErrors,
    onChange,
    onBlur,
    onSubmit,
    hasSubmit,
    deleteVal,
    deleteErr,
    resetValues,
    resetErrors,
    resetForm,
  };
}

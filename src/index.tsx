import { useState } from 'react';

export interface ListenerConfig {
  onSubmit?: Array<Function>;
  onChange?: Array<Function>;
  onBlur?: Array<Function>;
}

export interface useFormField {
  name: string;
  listener?: ListenerConfig | undefined;
}

export interface EventInfos {
  name: string;
  value: any;
}

export interface UseFormConfig {
  initialFields: Array<useFormField>;
  state?: { [key: string]: any } | undefined;
}

export function useForm({ state = {}, initialFields }: UseFormConfig) {
  const [fields, setFields] = useState(initialFields);
  const [values, setValues] = useState<{ [key: string]: any }>(state);
  const [errors, setErrors] = useState<{ [key: string]: any }>({});
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

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

  function getFns(listener: ListenerConfig | undefined): Array<Function> {
    let fns: Array<Function> = [];
    if (listener?.onChange) {
      fns = [...listener.onChange];
    }
    if (listener?.onBlur) {
      fns = [...fns, ...listener.onBlur];
    }
    if (listener?.onSubmit) {
      fns = [...fns, ...listener.onSubmit];
    }
    return fns;
  }

  // On Change
  function onChange(infos: EventInfos, listener: ListenerConfig | undefined) {
    hasSubmitted && setHasSubmitted(false);
    const { name, value } = infos;
    // Remove field error on change
    if (errors[name]) setErrors({ ...errors, [name]: undefined });

    // Set values in state
    setValues({
      ...values,
      [name]: value,
    });

    // If onChange listener, run it
    if (listener?.onChange) {
      setErrors({
        ...errors,
        [name]: runFns(listener.onChange, value),
      });
    }
  }

  function onBlur(infos: EventInfos, listener: ListenerConfig | undefined) {
    const { name, value } = infos;

    if (listener?.onBlur) {
      setErrors({
        ...errors,
        [name]: runFns(listener.onBlur, value),
      });
    }
  }

  // On Submit listener
  function onSubmit() {
    setHasSubmitted(true);

    let count = 0;
    let submitErrors: { [key: string]: any } = {};

    fields.forEach(field => {
      if (field.listener) {
        /* Reconcile onChange and onSubmit listeners: 
        onChange listener is also run on onSubmit */
        const fns = getFns(field.listener);

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

  const removeField = (name: string) => {
    setFields(fields => fields.filter(field => field.name !== name));
  };

  const addField = (field: useFormField, index: number) => {
    const newFields = [
      ...fields.slice(0, index),
      field,
      ...fields.slice(index),
    ];
    setFields(newFields);
  };

  const resetFields = () => setFields(initialFields);

  return {
    values,
    setValues,
    errors,
    setErrors,
    fields,
    setFields,
    onChange,
    onBlur,
    onSubmit,
    hasSubmitted,
    deleteVal,
    deleteErr,
    resetValues,
    resetErrors,
    resetForm,
    removeField,
    addField,
    resetFields,
  };
}

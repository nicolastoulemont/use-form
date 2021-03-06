import { useState, useEffect } from 'react'

export interface Listener {
  onSubmit?: Array<Function>
  onChange?: Array<Function>
  onBlur?: Array<Function>
}

export interface EventInfos {
  name: string
  value: any
}

export interface FieldOptions {
  name: string
  listener?: Listener | undefined
}

export type FieldsRecord<T extends FieldOptions> = Record<string | number, T>

export function recordToArray<T extends FieldOptions>(record: FieldsRecord<T>): Array<T> {
  let arr: Array<T> = []
  for (const key in record) {
    arr.push({ ...record[key], name: key.toString() })
  }
  return arr
}

export function arrayToRecord<T extends FieldOptions>(array: Array<T>) {
  return array.reduce((record: FieldsRecord<T>, field: T) => {
    record[field.name] = { ...field }
    return record
  }, {})
}

export interface UseForm<T> {
  initialFields?: Array<T>
  state?: { [key: string]: any } | undefined
}

export function useForm<T extends FieldOptions>({ state = {}, initialFields = [] }: UseForm<T>) {
  const [record, setRecord] = useState<FieldsRecord<T>>({})
  const [fields, setFields] = useState<Array<T>>(initialFields)
  const [values, setValues] = useState<{ [key: string]: any }>(state)
  const [errors, setErrors] = useState<{ [key: string]: any }>({})
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  useEffect(() => {
    setRecord(arrayToRecord(fields))
  }, [fields])

  // Shared
  function runFns(fns: Array<Function>, value: any): undefined | any {
    if (!fns || fns.length === 0) {
      return undefined
    }

    // Return the first error its find
    let err: undefined = undefined
    fns.forEach(fn => {
      if (typeof err === 'undefined' && typeof fn === 'function') {
        err = fn(value, values, errors, fields, hasSubmitted)
      }
    })
    return err
  }

  function getFns(listener: Listener | undefined): Array<Function> {
    let fns: Array<Function> = []
    if (listener?.onChange) {
      fns = [...listener.onChange]
    }
    if (listener?.onBlur) {
      fns = [...fns, ...listener.onBlur]
    }
    if (listener?.onSubmit) {
      fns = [...fns, ...listener.onSubmit]
    }
    return fns
  }

  // On Change
  function onChange(infos: EventInfos) {
    hasSubmitted && setHasSubmitted(false)
    const { name, value } = infos
    // Remove field error on change
    if (errors[name]) setErrors({ ...errors, [name]: undefined })

    // Set values in state
    setValues({
      ...values,
      [name]: value,
    })

    // If onChange listener, run it
    if (record[name].listener?.onChange) {
      setErrors({
        ...errors,
        [name]: runFns(record[name].listener?.onChange as Array<Function>, value),
      })
    }
  }

  function onBlur(infos: EventInfos) {
    const { name, value } = infos

    if (record[name].listener?.onBlur) {
      setErrors({
        ...errors,
        [name]: runFns(record[name].listener?.onBlur as Array<Function>, value),
      })
    }
  }

  // On Submit listener
  function onSubmit() {
    setHasSubmitted(true)

    let count = 0
    let submitErrors: { [key: string]: any } = {}

    fields.forEach(field => {
      if (field.listener) {
        /* Reconcile onChange and onSubmit listeners: 
        onChange listener is also run on onSubmit */
        const fns = getFns(field.listener)

        /* Build the submitErrors object in order to update the state later */
        const errors = runFns(fns, values[field.name])
        submitErrors[field.name] = errors
        // Increment errors to get the count
        if (errors) {
          count++
        }
      }
    })

    // Update errors state
    setErrors(submitErrors)

    // Return the form valid status: true / false, and the form error count
    return [count === 0, count]
  }

  function deleteVal(key: string) {
    setValues(values => ({ ...values, [key]: undefined }))
  }

  function deleteErr(key: string) {
    setErrors(errors => ({
      ...errors,
      [key]: undefined,
    }))
  }

  const resetValues = () => setValues({})
  const resetErrors = () => setErrors({})

  function resetForm() {
    setErrors({})
    setValues({})
  }

  function removeFields(names: Array<string> | string) {
    if (typeof names === 'string') {
      setFields(fields => fields.filter(field => field.name !== names))
    } else {
      setFields(fields => fields.filter(field => names.indexOf(field.name) === -1))
    }
  }

  function addFields(newFields: Array<T>, index: number) {
    const updatedFields = [...fields.slice(0, index), ...newFields, ...fields.slice(index)]
    setFields(updatedFields)
  }

  function changeField(fieldOptions: Partial<T>, name: string) {
    const updatedRecord = { ...record, [name]: { ...record[name], ...fieldOptions } }
    const updatedFields = recordToArray(updatedRecord)
    setFields(updatedFields)
  }

  function moveField(from: number, to: number) {
    const newFields = [...fields]
    newFields.splice(to, 0, newFields.splice(from, 1)[0])
    setFields(newFields)
  }

  const resetFields = () => setFields(initialFields)

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
    removeFields,
    addFields,
    changeField,
    moveField,
    resetFields,
  }
}

# Use-form

This use-form utility hook aims to facilitate the handling of complex forms validation and form field addition or removal.

## Disclaimer

This is a work in progress tool and mainly aimed at my personal use accross my projects.

## Installation

```bash
npm install @nicolastoulemont/use-form
or
yarn add @nicolastoulemont/use-form
```

## Usage

- Basic usage

The useForm hooks is designed withincremental / partial usage of its features in mind. As such, if the form doesn't require validation or fields manipulation it can be used without overhead

```typescript
export function BasicComponent() {
  const { values, onChange } = useForm()
  return (
    <div>
      <label>Email</label>
      <input
        name="email"
        value={values['email'] || ''}
        onChange={({ target: { name, value } }) => onChange({ name, value })}
      />
    </div>
  )
}
```

- Field level validation

In order to perform field level validation useForm hook require a object param containing the fields options array and optionally the initial values.
The field options must include at least a name property but can be extended to include other field related information such as its label, placeholder, type, etc.

```typescript
interface Field extends FieldOptions {
  label?: string
}

const required = (value: any) =>
  typeof value === 'undefined' || value === '' ? 'Required' : undefined

const hasAbc = (value: any) => (value.includes('abc') ? 'Has abc' : undefined)

const initialFields: Array<Field> = [
  {
    name: 'email',
    listener: {
      onChange: [hasAbc],
    },
  },
  {
    name: 'password',
    listener: {
      onBlur: [required],
    },
  },
  {
    name: 'address',
    listener: {
      onSubmit: [required],
    },
  },
  {
    name: 'first_name',
    label: 'first_name_label',
  },
]
```

- Validation functions

The listener object allow the user to insert an array of functions to be executed either on onChange, onBlur or onSubmit.
Theses functions have access to the field value, the form values, the form errors, the form fields, the form hasSubmitted status as params, in this order.

The return value of validations functions is stored on the errors object with the field name as key.

```typescript
function validationFn(fieldValue, values, errors, fields, hasSubmitted) {
  // Set validation rule(s)
}
```

- Fields manipulation

If given an initial fields array, the useForm return a fields array that can then be used as following :

```typescript
interface Field extends FieldOptions {
  label?: string
}

export function BasicComponent() {
  const required = (value: any) =>
    typeof value === 'undefined' || value === '' ? 'Required' : undefined

  const hasAbc = (value: any) => (value.includes('abc') ? 'Has abc' : undefined)

  const initialFields: Array<Field> = [
    {
      name: 'reset',
      listener: {
        onChange: [() => resetFields()],
      },
    },
    /* ...fields */
    {
      name: 'address',
      listener: {
        onSubmit: [required],
      },
    },
  ]

  const { values, setValues, errors, setErrors, fields, onChange, onBlur, onSubmit } = useForm({
    initialFields,
  })

  function handleSubmit() {
    onSubmit()
  }

  return (
    <div>
      {fields.map(field => (
        <div key={field.name}>
          {field.label && <label>{field.label}</label>}
          <input
            name={field.name}
            value={values[field.name] || ''}
            onChange={({ target: { name, value } }) => onChange({ name, value })}
            onBlur={({ target: { name, value } }) => onBlur({ name, value })}
          />
          {errors[field.name] && <div>{errors[field.name]}</div>}
        </div>
      ))}
    </div>
  )
}
```

The useForm hooks also expose 5 fields manipulation methods on the Fields array

- removeFields

```typescript
function removeFields(names: Array<string> | string): void
```

This function will filter out one or more fields based on their names

- addFields

```typescript
function addFields(newFields: Array<T>, index: number): void
```

This function insert one or more fields at the give index

- changeField

```typescript
function changeField(fieldOptions: Partial<T>, name: string): void
```

This function will update a field selected by name with the given fieldOptions.

- moveField

```typescript
function moveField(from: number, to: number): void
```

This function will move a field from one index to another

- resetFields

```typescript
function resetFields(): void
```

This function will reset the fields to the initialFields array

## Api

The useForm hooks returns the following :

- values: The state values as an object.

```typescript
{ [field.name]: value }
```

- setValues: The React dispatch function updating the values state.
- errors: The errors as an object. The return value of the onChange and onBlur listeners functions are stored in the errors state.

```typescript
{ [field.name]: value }
```

- setErrors: The React dispatch function update the errors state.
- onChange: Update the values state and run the field onChange listeners.

```typescript
export interface EventInfos {
  name: string
  value: any
}

function onChange(infos: EventInfos) {
  hasSubmitted && setHasSubmitted(false)
  const { name, value } = infos
  if (errors[name]) setErrors({ ...errors, [name]: undefined })

  setValues({
    ...values,
    [name]: value,
  })

  if (record[name].listener?.onChange) {
    setErrors({
      ...errors,
      [name]: runFns(record[name].listener?.onChange as Array<Function>, value),
    })
  }
}
```

- onBlur: Run the field onBlur listeners.

```typescript
export interface EventInfos {
  name: string
  value: any
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
```

- onSubmit: Run all the fields onChange and onSubmit listeners. It also return the form validity (boolean) and the errors count.

```typescript
function onSubmit() {
  setHasSubmitted(true)

  let count = 0
  let submitErrors: { [key: string]: any } = {}

  fields.forEach(field => {
    if (field.listener) {
      const fns = getFns(field.listener)
      const errors = runFns(fns, values[field.name])
      submitErrors[field.name] = errors
      if (errors) {
        count++
      }
    }
  })
  setErrors(submitErrors)
  return [count === 0, count]
}
```

- hasSubmitted (boolean): The submit state of the form. Set to false by the onChange function.
- deleteVal: Helper function to delete a specific value in the values state.

```typescript
function deleteVal(key: string) {
  setValues(values => ({ ...values, [key]: undefined }))
}
```

- deleteErr: Helper function to delete a specific error in the errors state.

```typescript
function deleteErr(key: string) {
  setErrors(errors => ({
    ...errors,
    [key]: undefined,
  }))
}
```

- resetValues: Helper function to reset the values state to an empty object.

```typescript
const resetValues = () => setValues({})
```

- resetErrors: Helper function to reset the errors state to an empty object.

```typescript
const resetErrors = () => setErrors({})
```

- resetForm: Helper function to reset both the errors and values states to an empty object.

```typescript
function resetForm() {
  setErrors({})
  setValues({})
}
```

- removeFields: Remove one or more field from the fields array

```typescript
function removeFields(names: Array<string> | string) {
  if (typeof names === 'string') {
    setFields(fields => fields.filter(field => field.name !== names))
  } else {
    setFields(fields => fields.filter(field => names.indexOf(field.name) === -1))
  }
}
```

- addFields: Add one or more field to the fields array

```typescript
function addFields(newFields: Array<FieldOptions>, index: number) {
  const updatedFields = [...fields.slice(0, index), ...newFields, ...fields.slice(index)]
  setFields(updatedFields)
}
```

- changeField: Update one field

```typescript
function changeField(fieldOptions: Partial<FieldOptions>, name: string) {
  const updatedRecord = { ...record, [name]: { ...record[name], ...fieldOptions } }
  const updatedFields = recordToArray(updatedRecord)
  setFields(updatedFields)
}
```

- moveField: Move a field in the array

```typescript
function moveField(from: number, to: number) {
  const newFields = [...fields]
  newFields.splice(to, 0, newFields.splice(from, 1)[0])
  setFields(newFields)
}
```

- resetFields: Set the fields back to the initialFields array.

```typescript
const resetFields = () => setFields(initialFields)
```

## Built with

- [tsdx](https://github.com/jaredpalmer/tsdx)
- [React](https://github.com/facebook/react)

## Versionning

This tool use [SemVer](http://semver.org/) for versioning.

## Licence

MIT

import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { useForm, useFormField } from '../src';

function BasicComponent() {
  const {
    values,
    setValues,
    errors,
    setErrors,
    onChange,
    onBlur,
    onSubmit,
    deleteVal,
    deleteErr,
    resetValues,
    resetErrors,
    resetForm,
  } = useForm();

  const required = (value: any) =>
    typeof value === 'undefined' || value === '' ? 'Required' : undefined;

  const hasAbc = (value: any) =>
    value.includes('abc') ? 'Has abc' : undefined;

  const fields: Array<useFormField> = [
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
  ];

  function handleSubmit() {
    onSubmit(fields);
  }

  return (
    <div>
      {fields.map((field, index) => (
        <div key={index}>
          <input
            data-testid={field.name}
            name={field.name}
            value={values[field.name] || ''}
            onChange={({ target: { name, value } }) =>
              onChange({ name, value }, field.listener)
            }
            onBlur={({ target: { name, value } }) =>
              onBlur({ name, value }, field.listener)
            }
          />
          {errors[field.name] && (
            <div data-testid={field.name.concat('-error')}>
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}
      <button data-testid="submit" onClick={handleSubmit}>
        Submit
      </button>
      <button
        data-testid="delete-val"
        onClick={() => ['email', 'password'].forEach(key => deleteVal(key))}
      >
        Delete field
      </button>
      <button
        data-testid="delete-err"
        onClick={() => ['email', 'password'].forEach(key => deleteErr(key))}
      >
        Delete error
      </button>
      <button data-testid="reset-val" onClick={() => resetValues()}>
        Reset values
      </button>
      <button data-testid="reset-err" onClick={() => resetErrors()}>
        Reset errors
      </button>
      <button data-testid="reset-form" onClick={() => resetForm()}>
        Reset Form
      </button>
      <button
        data-testid="set-val"
        onClick={() =>
          setValues({ email: 'settest@test.com', password: 'setpassword' })
        }
      >
        set Values
      </button>
      <button
        data-testid="set-err"
        onClick={() =>
          setErrors({ email: 'email error', password: 'password error' })
        }
      >
        set Error
      </button>
    </div>
  );
}

describe('Testing hook fns', () => {
  // Basic functionning
  it('Input and value', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    fireEvent.change(email, { target: { value: 'test@test.com' } });
    // @ts-ignore
    expect(email.value).toBe('test@test.com');
  });

  // Validation
  it('onChange validation', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    fireEvent.change(email, { target: { value: 'abc' } });
    const emailError = getByTestId('email-error');
    expect(emailError).toBeVisible();
  });

  it('onBlur validation', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const password = getByTestId('password');
    fireEvent.blur(password);
    const passwordError = getByTestId('password-error');
    expect(passwordError).toBeVisible();
  });

  it('onSubmit validation', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    fireEvent.change(email, { target: { value: 'abc' } });

    const submit = getByTestId('submit');
    fireEvent.click(submit);
    const emailError = getByTestId('email-error');
    const addressError = getByTestId('address-error');
    expect(emailError).toBeVisible();
    expect(addressError).toBeVisible();
  });

  // Deletes
  it('Delete item value', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    const password = getByTestId('password');
    fireEvent.change(email, { target: { value: 'test@test.com' } });
    fireEvent.change(password, { target: { value: 'password' } });
    const deleteValBtn = getByTestId('delete-val');
    fireEvent.click(deleteValBtn);
    // @ts-ignore
    expect(email.value).toBe('');
    // @ts-ignore
    expect(password.value).toBe('');
  });

  it('Delete errors', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    const password = getByTestId('password');
    fireEvent.change(email, { target: { value: 'abc' } });
    fireEvent.blur(password);

    const emailError = getByTestId('email-error');
    const passwordError = getByTestId('password-error');
    expect(emailError).toBeVisible();
    expect(passwordError).toBeVisible();

    const deleteErrBtn = getByTestId('delete-err');
    fireEvent.click(deleteErrBtn);
    expect(emailError).not.toBeInTheDocument();
    expect(passwordError).not.toBeInTheDocument();
  });

  // Reset
  it('Reset all items value', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    const password = getByTestId('password');
    const address = getByTestId('address');
    fireEvent.change(email, { target: { value: 'test@test.com' } });
    fireEvent.change(password, { target: { value: 'password' } });
    fireEvent.change(address, { target: { value: 'address' } });
    const deleteValBtn = getByTestId('reset-val');
    fireEvent.click(deleteValBtn);
    // @ts-ignore
    expect(email.value).toBe('');
    // @ts-ignore
    expect(password.value).toBe('');
    // @ts-ignore
    expect(address.value).toBe('');
  });

  it('Reset all items errors', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    const password = getByTestId('password');
    fireEvent.change(email, { target: { value: 'abc' } });
    fireEvent.blur(password);
    const submitBtn = getByTestId('submit');
    fireEvent.click(submitBtn);

    const emailError = getByTestId('email-error');
    const passwordError = getByTestId('password-error');
    const addressError = getByTestId('address-error');
    expect(emailError).toBeVisible();
    expect(passwordError).toBeVisible();
    expect(addressError).toBeVisible();

    const resetErrs = getByTestId('reset-err');
    fireEvent.click(resetErrs);

    expect(emailError).not.toBeInTheDocument();
    expect(passwordError).not.toBeInTheDocument();
    expect(addressError).not.toBeInTheDocument();
  });

  it('Reset values and errors', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    const password = getByTestId('password');
    fireEvent.change(email, { target: { value: 'abc' } });
    fireEvent.blur(password);
    const submitBtn = getByTestId('submit');
    fireEvent.click(submitBtn);

    const emailError = getByTestId('email-error');
    const passwordError = getByTestId('password-error');
    const addressError = getByTestId('address-error');
    expect(emailError).toBeVisible();
    expect(passwordError).toBeVisible();
    expect(addressError).toBeVisible();

    const resetForm = getByTestId('reset-form');
    fireEvent.click(resetForm);

    // @ts-ignore
    expect(email.value).toBe('');
    expect(emailError).not.toBeInTheDocument();
    expect(passwordError).not.toBeInTheDocument();
    expect(addressError).not.toBeInTheDocument();
  });

  // Direct set
  it('set items values', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const email = getByTestId('email');
    const password = getByTestId('password');
    const setValBtn = getByTestId('set-val');
    fireEvent.click(setValBtn);
    // @ts-ignore
    expect(email.value).toBe('settest@test.com');
    // @ts-ignore
    expect(password.value).toBe('setpassword');
  });

  it('set items errors', async () => {
    const { getByTestId } = render(<BasicComponent />);
    const setErrBtn = getByTestId('set-err');
    fireEvent.click(setErrBtn);

    const emailError = getByTestId('email-error');
    const passwordError = getByTestId('password-error');
    expect(emailError).toBeVisible();
    expect(passwordError).toBeVisible();
  });
});

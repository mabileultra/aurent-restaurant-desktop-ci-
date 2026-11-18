// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseSelect from '../../../src/components/ui/BaseSelect';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, opts) => opts?.defaultValue || k }),
}));

afterEach(() => cleanup());

describe('BaseSelect with react-hook-form register()', () => {
  it('selects an option and submits the chosen value without resetting on blur', async () => {
    const schema = z.object({ storeId: z.string().trim().min(1, 'Выберите магазин') });
    const onSubmitted = vi.fn();

    function TestForm() {
      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { storeId: '' },
      });

      return (
        <form onSubmit={handleSubmit(onSubmitted)}>
          <BaseSelect
            {...register('storeId')}
            placeholder="Выберите магазин"
            options={[
              { value: '', label: 'Выберите магазин' },
              { value: '1', label: 'MIRONKUL AGRO GLOBAL' },
            ]}
          />
          {errors.storeId && <p role="alert">{errors.storeId.message}</p>}
          <button type="submit">Сохранить</button>
        </form>
      );
    }

    const { getByRole, getByText, queryByRole } = render(<TestForm />);

    fireEvent.click(getByRole('button', { name: /Выберите магазин/i }));
    fireEvent.mouseDown(getByRole('option', { name: 'MIRONKUL AGRO GLOBAL' }));

    expect(getByRole('button', { name: /MIRONKUL AGRO GLOBAL/i })).toBeTruthy();

    fireEvent.click(getByText('Сохранить'));
    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledWith({ storeId: '1' }, expect.anything());
    });
    expect(queryByRole('alert')).toBeNull();
  });
});

import { $, component$, useSignal, type Signal } from '@builder.io/qwik';
import type { User } from '../types';
import { postMeals } from '../api';
import { PrimaryButton } from './PrimaryButton';
import { protectedApiCall } from '../protected-api-call';

type DashboardProps = {
  user: Signal<User>;
};

export const Dashboard = component$((props: DashboardProps) => {
  const { user } = props;
  const form = useSignal({
    adult: 0,
    youth: 0,
    inventory: 0,
  });
  const mealSuccessMessage = useSignal<string>();

  const onCreateMealFormSubmit = $(async () => {
    const { adult, youth, inventory } = form.value;
    const res = await protectedApiCall(
      postMeals,
      user,
    )({
      adult,
      youth,
      inventory,
    });

    if (res.status !== 201) {
      console.error('Failed to create meal:', res.data.message);
      return;
    }

    console.log('Meal created successfully:', res.data);
    mealSuccessMessage.value = JSON.stringify(res.data, null, 2);
  });
  return (
    <div class='flex h-screen w-screen flex-col items-center justify-center bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'>
      <h1 class='text-2xl font-bold'>Dashboard</h1>
      <p class='mt-2'>{`Welcome to your dashboard, ${user.value.email}`}</p>
      <p class='mt-2'>{`Your refreshToken is ${user.value.refreshToken}`}</p>
      <p class='mt-2'>{`Your accessToken is ${user.value.accessToken}`}</p>
      <p class='mt-2'>{`Last refreshed: ${user.value.lastRefreshed}`}</p>
      <form class='mt-4'>
        <input
          type='input'
          name='adult'
          placeholder='Number of adults'
          class='rounded border p-2'
          onChange$={(e) => {
            form.value.adult = parseInt((e.target as HTMLInputElement).value, 10) || 0;
          }}
        />
        <input
          type='input'
          name='youth'
          placeholder='Number of youth'
          class='rounded border p-2'
          onChange$={(e) => {
            form.value.youth = parseInt((e.target as HTMLInputElement).value, 10) || 0;
          }}
        />
        <input
          type='input'
          name='inventory'
          placeholder='Inventory'
          class='rounded border p-2'
          onChange$={(e) => {
            form.value.inventory = parseInt((e.target as HTMLInputElement).value, 10) || 0;
          }}
        />
        <PrimaryButton type='button' onClick={onCreateMealFormSubmit}>
          Create Meal
        </PrimaryButton>
      </form>
      {mealSuccessMessage.value && (
        <div class='mt-4 rounded bg-green-100 p-2 text-green-800'>
          <h2 class='font-bold'>Meal Created Successfully!</h2>
          <pre>{mealSuccessMessage.value}</pre>
        </div>
      )}
    </div>
  );
});

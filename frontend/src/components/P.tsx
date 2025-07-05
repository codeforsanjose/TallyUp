import { component$, Slot } from '@builder.io/qwik';

export const P = component$(() => {
  return (
    <p class='text-gray-500 dark:text-gray-400'>
      <Slot />
    </p>
  );
});

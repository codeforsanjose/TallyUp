import { component$, Slot } from '@builder.io/qwik';
import type { ButtonProps } from './PrimaryButton';

export const SecondaryButton = component$((props: ButtonProps) => {
  return (
    <button class='rounded bg-[#f3d84e]' onClick$={props.onClick}>
      <Slot />
    </button>
  );
});

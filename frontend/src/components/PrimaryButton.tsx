import { component$, Slot } from '@builder.io/qwik';

export type ButtonProps = {
  type: HTMLButtonElement['type'];
  onClick?: () => void;
};

export const PrimaryButton = component$((props: ButtonProps) => {
  return (
    <button class='rounded bg-[#5d5e5b] text-[#f2f3f0]' onClick$={props.onClick} type={props.type}>
      <Slot />
    </button>
  );
});

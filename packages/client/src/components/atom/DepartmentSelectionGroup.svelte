<script lang="ts">
  import { afterUpdate, createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';

  export let selectedIndex = 0;

  const dispatch = createEventDispatcher();
  const currentId = writable(null);

  export let selectedId = undefined;

  $: currentIndex = -1;
  $: departments = [];

  $: if (departments[currentIndex]) {
    dispatch('change', currentIndex);
    currentId.set(departments[currentIndex].id);
    selectedId = departments[currentIndex].id;
  }

  setContext('DepartmentSelectionGroup', {
    currentId,
    add: ({ id, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        selectedIndex = departments.length;
      }

      departments = [...departments, { id, selected }];
    },
    update: (id: string) => {
      selectedIndex = departments.map(({ id: v }) => v).indexOf(id);
    },
    change: (direction: number) => {
      let index = currentIndex + direction;

      if (index < 0) {
        index = departments.length - 1;
      } else if (index >= departments.length) {
        index = 0;
      }

      selectedIndex = index;
    },
  });

  afterUpdate(() => {
    if (selectedIndex !== currentIndex) {
      currentIndex = selectedIndex;
    }
  });
</script>

<div class="wrap flex gap-2 overflow-y-hidden overflow-x-scroll py-2">
  <slot />
</div>

<style lang="postcss">
  .wrap {
    scrollbar-color: #c2c2c2 #e0e0e0;
    scrollbar-width: thin;
  }
</style>

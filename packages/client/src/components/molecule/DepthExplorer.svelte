<script lang="ts">
  import type { DepthData } from '$lib/types';

  export let data: DepthData[];
  export let selections: string[] = [];
  let clazz = '';
  export { clazz as class };
  export let breadcrumbClass = '';
  export let rootText = '';

  function select(depth: number, id: string) {
    selections[depth] = id;
    selections = selections.slice(0, depth + 1);
  }

  function deselect(depth: number) {
    selections = selections.slice(0, depth);
  }

  $: selectedDepth = selections.reduce<DepthData[]>((depthData: DepthData[], elem: string) => {
    if (!depthData || !depthData.length) return [data.find((v) => v.id === elem)];
    return [...depthData, depthData.at(-1).children.find((v) => v.id === elem)];
  }, []);
  $: currentDepth = selections.reduce<[number, DepthData[]]>(
    ([depthIdx, depth]: [number, DepthData[]], elem: string) => {
      if (!depth) return [depthIdx, depth];
      const selected = depth.find((options) => options.id === elem);
      return selected?.children ? [depthIdx + 1, selected.children] : [depthIdx, depth];
    },
    [0, data],
  );
</script>

<slot name="breadcrumb" {selectedDepth}>
  <header class="{breadcrumbClass} breadcrumb flex">
    {#if selections.length}
      <button class="cursor-pointer text-primary-800" on:click={() => deselect(0)}
        >{rootText}</button>
      {#each selections as selection, index}
        {#if index + 1 < selections.length}
          <button class="cursor-pointer text-primary-800" on:click={() => select(index, selection)}>
            {selectedDepth[index].name}
          </button>
        {:else}
          <span class="text-gray-500">{selectedDepth[index].name}</span>
        {/if}
      {/each}
    {:else}
      <span class="text-gray-500">{rootText}</span>
    {/if}
  </header>
</slot>

<div class={clazz}>
  {#each currentDepth[1] as option}
    <div
      role="button"
      tabindex="0"
      on:click={() => {
        select(currentDepth[0], option.id);
      }}
      on:keydown
      on:keyup={() => {
        select(currentDepth[0], option.id);
      }}>
      <slot
        name="item"
        depth={currentDepth[0]}
        {option}
        selected={selections.at(-1) === option.id} />
    </div>
  {/each}
</div>

<style lang="postcss">
  .breadcrumb > button:after {
    content: '>';
    @apply mx-1 text-gray-500;
  }
</style>

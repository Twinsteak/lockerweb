<script lang="ts">
  export let id: string;
  export let label: string;
  export let value: string;
  export let showLabel: boolean = false;
  export let labelClass: string = '';
  export let selectClass: string = '';
  export let invalidClass: string = '';
  export let invalidText: string = '값을 입력하세요.';
  let clazz = '';
  export { clazz as class };
</script>

<div class="{clazz} flex flex-col">
  <!--suppress XmlInvalidId -->
  <label class="{labelClass} mb-1 block font-bold" for={id} class:hidden={!showLabel}
    >{label ?? ''} <span class:hidden={!$$props.required} class="text-red-800">*</span></label>
  <select
    {id}
    class="{selectClass} rounded-md border-transparent bg-gray-100 transition-all hover:bg-gray-200 focus:bg-white disabled:bg-gray-300 disabled:text-gray-400"
    bind:value
    {...$$restProps}>
    <slot />
  </select>
  <p class="{invalidClass} mt-1 hidden">{invalidText}</p>
</div>

<style lang="postcss">
  select:invalid ~ p {
    @apply block;
  }
</style>

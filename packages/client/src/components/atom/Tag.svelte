<script lang="ts">
  let clazz = '';
  export let style = '';
  export { clazz as class };
</script>

<div on:click on:keyup on:keydown role="none" class="{clazz} inline rounded-xl py-1 px-2 font-semibold" style={`${style || ''}`}>
  <slot />
</div>

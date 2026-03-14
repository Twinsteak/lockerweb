<script lang="ts">
  import { getBuildingName } from '$lib/utils';
  import { config } from '$lib/store';
  import { getServiceConfig } from '$lib/api/config';
  import MapCanvas from 'src/components/atom/MapCanvas.svelte';

  export let selectedBuildingId: string;
  export let selectedFloor: string;
  export let selectedSectionId: string;

  function resolveFloorMapSrc(buildingId: string, floor: string): string {
    return `/floorMaps/${buildingId}/${floor}.png`;
  }

  function resolveHighlightSectionSrc(buildingId: string, floor: string, sectionId: string): string {
    return `/floorMaps/${buildingId}/${floor}/${sectionId}.svg`;
  }

  let clazz = '';
  export { clazz as class };

  let src: string;
  let highlightSrc: string = null;
  let alt = '배치도';

  $: if ($config.success && selectedBuildingId) {
    const serviceConfig = getServiceConfig($config?.result);
    alt = `${getBuildingName(
      serviceConfig.buildings,
      selectedBuildingId,
    )} ${selectedFloor}층 배치도`;
    src = resolveFloorMapSrc(selectedBuildingId, selectedFloor);
    highlightSrc = null;
  }

  $: if ($config.success && selectedSectionId) {
    highlightSrc = resolveHighlightSectionSrc(selectedBuildingId, selectedFloor, selectedSectionId);
  }
</script>

{#key `${selectedBuildingId}-${selectedFloor}-${selectedSectionId}`}
  <!-- TODO: load highlight position in database -->
  <MapCanvas class={clazz} {src} {alt} {highlightSrc} highlightX={0} highlightY={0} />
{/key}

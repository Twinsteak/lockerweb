<script lang="ts">
  import type {
    BuildingRemoveRequest,
    BuildingUpdateRequest,
    DepthData,
    SectionRemoveRequest,
    SectionUpdateRequest,
  } from '$lib/types';
  import DepthExplorer from '../../DepthExplorer.svelte';
  import AddSquare from '../../../../icons/AddSquare.svelte';
  import SelectScreen from '../../../atom/SelectScreen.svelte';
  import BuildingSettings from './BuildingSettings.svelte';
  import SectionSettings from './SectionSettings.svelte';

  export let buildings: { [buildingNum: string]: Building } = {};

  let selections: string[] = [];

  function formatFloor(floor: string) {
    return floor.length < 2 ? `${floor}F` : floor;
  }

  function constructDepthData(buildingList: { [buildingNum: string]: Building }): DepthData[] {
    if (selections.length) {
      if (selections[0] !== 'add' && !buildingList[selections[0]]) selections = [];
      if (selections[1] && selections[1] !== 'add') {
        const [floor, id] = selections[1].split('-');
        const sect = buildingList[selections[0]];
        if (!sect[floor]?.[id]) selections = [];
      }
    }
    return [
      ...Object.entries(buildings).map<DepthData>(([buildingNum, building]) => ({
        id: buildingNum,
        name: building.name,
        children: [
          ...Object.entries(building.lockers).flatMap<DepthData>(([floor, sections]) =>
            Object.keys(sections).map<DepthData>((sectionId) => ({
              id: `${floor}-${sectionId}`,
              name: `${formatFloor(floor ?? '')} 구역 ${sectionId}`,
            })),
          ),
          { id: 'add', name: '구역 추가...' },
        ],
      })),
      { id: 'add', name: '건물 추가...' },
    ];
  }

  function buildingUpdate(evt: CustomEvent<BuildingUpdateRequest>) {
    if (!buildings[evt.detail.id]) {
      buildings[evt.detail.id] = {
        id: evt.detail.id,
        name: evt.detail.name,
        lockers: {},
      };
      selections = [evt.detail.id];
      return;
    }
    buildings[evt.detail.id].name = evt.detail.name;
    buildings = { ...buildings };
  }

  function buildingRemove(evt: CustomEvent<BuildingRemoveRequest>) {
    delete buildings[evt.detail.id];
    buildings = { ...buildings };
    if (selections[0] === evt.detail.id) selections = [];
  }

  function sectionUpdate(evt: CustomEvent<SectionUpdateRequest>) {
    const { floor, id, height, disabled, subsections } = evt.detail;
    if (!buildings[selections[0]].lockers) buildings[selections[0]].lockers = {};
    if (!buildings[selections[0]].lockers[floor]) buildings[selections[0]].lockers[floor] = {};
    buildings[selections[0]].lockers[floor][id] = {
      subsections,
      height,
      disabled,
    };
    buildings = { ...buildings };
  }

  function sectionRemove(evt: CustomEvent<SectionRemoveRequest>) {
    const { floor, id } = evt.detail;
    delete buildings[selections[0]].lockers[floor][id];
    if (Object.keys(buildings[selections[0]].lockers[floor]).length === 0)
      delete buildings[selections[0]].lockers[floor];
    buildings = { ...buildings };
  }

  let depthData = constructDepthData(buildings);

  $: selectedBuilding = buildings[selections[0]];
  $: selectedFloor =
    selections[1] && selections[1] !== 'add' ? selections[1].split('-')[0] : undefined;
  $: selectedSectionId =
    selections[1] && selections[1] !== 'add' ? selections[1].split('-')[1] : undefined;
  $: selectedSection = selectedFloor
    ? selectedBuilding.lockers[selectedFloor]?.[selectedSectionId]
    : undefined;

  $: if (buildings) {
    depthData = constructDepthData(buildings);
  }
</script>

<section class="flex flex-col flex-wrap gap-2 xl:flex-row">
  <aside class="rounded-md bg-gray-200 p-3 lg:min-h-[540px] xl:w-1/4">
    <DepthExplorer
      rootText="건물 선택"
      breadcrumbClass="p-1"
      class="max-h-[480px] overflow-x-hidden overflow-y-scroll rounded-md bg-white"
      data={depthData}
      bind:selections>
      <button
        tabindex="0"
        slot="item"
        let:option
        let:selected
        class="my-1 flex w-full cursor-pointer justify-between
							border-l-2 border-white bg-white p-2 text-gray-700 outline-none
							outline-0 outline-primary-800 transition-all
							hover:scale-101 hover:brightness-90
							focus:brightness-90 active:scale-100
							active:brightness-75"
        class:selected>
        {option.name}
        {#if option.id === 'add'}
          <AddSquare />
        {/if}
      </button>
    </DepthExplorer>
  </aside>
  <article class="grow overflow-hidden rounded-md">
    {#if selections.length === 0}
      <SelectScreen class="min-h-[540px]" />
    {:else if selections.length === 1}
      <BuildingSettings
        on:update={buildingUpdate}
        on:remove={buildingRemove}
        original={selectedBuilding}
        isNew={selections[0] === 'add'} />
    {:else if selections.length === 2}
      <SectionSettings
        on:update={sectionUpdate}
        on:remove={sectionRemove}
        floor={selectedFloor}
        originalId={selectedSectionId}
        original={selectedSection}
        isNew={selections[1] === 'add'} />
    {/if}
  </article>
</section>

<style lang="postcss">
  .selected {
    @apply border-primary-800 bg-gray-100 font-bold;
  }
</style>

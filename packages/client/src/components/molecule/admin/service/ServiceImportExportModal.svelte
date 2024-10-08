<script lang="ts">
  import Modal from '../../Modal.svelte';
  import { config } from '$lib/store';
  import DocumentArrowRight from '../../../../icons/DocumentArrowRight.svelte';
  import { createEventDispatcher } from 'svelte';
  import { ServiceConfigSchema, getServiceConfig } from '$lib/api/config';
  import TextGrammarCheckmark from '../../../../icons/TextGrammarCheckmark.svelte';
    import TextArea from 'src/components/atom/form/TextArea.svelte';
    import Checkmark from 'src/icons/Checkmark.svelte';
    import Dismiss from 'src/icons/Dismiss.svelte';

  const dispatch = createEventDispatcher<{
    submit: ServiceConfigResponse;
  }>();

  $: serviceConfig = $config && $config.success ? getServiceConfig($config.result) : {};

  export let open = false;

  const title = '서비스 설정 가져오기/내보내기';
  let configText;
  $: if(serviceConfig && !configText) {
    configText = JSON.stringify(serviceConfig, null, 2);
  }
  let green = false;
  let error = '';
  $: if(configText) {
    error = '';
    green = false;
  }

  function checkConfigJSON(): boolean {
    try {
      const parsed = ServiceConfigSchema.safeParse(JSON.parse(configText));
      if(parsed.success == false) {
        error = JSON.stringify(parsed.error, null, 2);
      }
      return parsed.success;
    } catch (e) {
      console.error(e.message);
      error = e.message;
      return false;
    }
  }

  function updateConfigs() {
    const parsed = ServiceConfigSchema.safeParse(JSON.parse(configText));
    if(parsed.success) {
      const { name, activateFrom, activateTo, alert, buildings } = parsed.data as ServiceConfig;
      const configResponse: ServiceConfigResponse = {
        id: 'SERVICE',
        name,
        ...(activateFrom
          ? { activate_from: activateFrom.toISOString() }
          : { activate_from: null }),
        ...(activateTo
          ? { activate_to: activateTo.toISOString() }
          : { activate_to: null }),
        ...(alert ? { alert } : { alert: null }),
        buildings,
      }
      dispatch('submit', configResponse);
    }
  }
</script>

<Modal
  on:close
  on:click:secondary={() => green = checkConfigJSON()}
  on:click={updateConfigs}
  {title}
  bind:open
  primaryDisabled={!green}
  primaryText="가져오기"
  secondaryText="검증"
  isPrimaryBtnIconRight
  isSecondaryBtnIconRight
  {...$$restProps}>
  <div class="flex flex-col gap-3 h-full">
    <TextArea
      class="h-full"
      id="json"
      bind:value={configText}
      label="서비스 설정 데이터"
      showLabel
    />
    <p class="text-gray-800 text-sm">데이터를 복사하여 저장하거나, 직접 수정하여 서비스에 적용할 수 있습니다.</p>
    {#if green}
      <div class="text-green-800 flex items-center gap-1">
        <Checkmark class="w-3" />
        <p class="text-xs font-bold">검증 성공!</p>
      </div>
    {:else if error}
      <div class="text-red-800 flex items-center gap-1">
        <Dismiss class="w-3" />
        <p class="text-xs font-bold">검증 실패</p>
      </div>
      <pre class="rounded-md p-1 bg-white text-red-800 whitespace-pre-wrap text-xs font-mono">{error}</pre>
    {:else}
      <p class="text-xs">데이터를 가져오려면 검증하세요.</p>
    {/if}
  </div>
  <DocumentArrowRight slot="primaryIcon" />
  <TextGrammarCheckmark slot="secondaryIcon" />
</Modal>

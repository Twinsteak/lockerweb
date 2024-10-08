<script lang="ts">
  import Navigation from './Navigation.svelte';
  import NavigationHeader from '../atom/NavigationHeader.svelte';
  import Soongsil from '../../icons/Soongsil.svelte';
  import NavigationProfile from '../atom/NavigationProfile.svelte';
  import { config, user } from '$lib/store';
  import Profile from '../../components/molecule/Profile.svelte';
  import NavigationContent from '../atom/NavigationContent.svelte';
  import NavigationFooter from '../atom/NavigationFooter.svelte';
  import Divider from '../../components/atom/Divider.svelte';
  import NavigationCollapseButton from '../atom/NavigationCollapseButton.svelte';
  import Button from '../atom/Button.svelte';
  import ArrowExportLtr from '../../icons/ArrowExportLtr.svelte';
  import Shell from './Shell.svelte';
  import { fly } from 'svelte/transition';

  let clazz = '';
  export { clazz as class };

  export let navigationClass = '';
  export let mainClass = '';

  export let navigationCollapsed = true;

  export let collapsable = true;

  export let disableBlock = false;

  let serviceName = '사물함 예약 시스템';

  $: if ($config && $config.success) {
    serviceName =
      $config.result.find((c: Config) => c.id === 'SERVICE')?.name ?? '사물함 예약 시스템';
  }
</script>

<Shell class={clazz} {navigationClass} {mainClass} {disableBlock}>
  <Navigation
    slot="navigation"
    class="w-full flex-row"
    {collapsable}
    bind:collapsed={navigationCollapsed}>
    <NavigationHeader class="py-1 lg:py-0 lg:pt-10" slot="header">
      <slot name="navigation_header">
        <div class="flex grow flex-col flex-wrap items-start">
          <Soongsil class="h-12 w-12 lg:h-20 lg:w-20" />
        </div>
        {#if collapsable}
          <div class="flex items-center justify-center">
            <NavigationCollapseButton />
          </div>
        {/if}
      </slot>
    </NavigationHeader>
    <p transition:fly={{ y: -20, duration: 200 }} class="shrink font-semibold">{serviceName}</p>
    <NavigationProfile>
      <slot name="navigation_profile">
        <Profile user={$user && $user.success ? $user.result : undefined} />
      </slot>
    </NavigationProfile>
    <Divider class="my-6" />
    <NavigationContent>
      <slot name="navigation_content" />
    </NavigationContent>
    <NavigationFooter>
      <slot name="navigation_footer">
        <Button class="bg-primary-800 text-white" href="/logout">
          <ArrowExportLtr slot="icon" />
          로그아웃
        </Button>
      </slot>
    </NavigationFooter>
  </Navigation>
  <slot />
</Shell>

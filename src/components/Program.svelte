<script>
  import { onMount } from "svelte";
  import { createTimer } from "animejs";

  let radio = [];
  let loading = true;
  let dateString = "";

  // TV Guide timeline config
  const SECONDS_IN_DAY = 24 * 60 * 60;
  const PX_PER_MINUTE = 6; // visual scale: 1440m * 6px = 8640px total width
  const PX_PER_SECOND = PX_PER_MINUTE / 60;
  const NOW_OFFSET_PX = 200; // fixed "now" marker from the left edge
  const TICK_BAR_HEIGHT = 28;
  const ROW_HEIGHT = 40;

  const EPOCH = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();
  let now = Date.now();
  let guideTimer;

  $: scheduleWidth = SECONDS_IN_DAY * PX_PER_SECOND;
  $: scheduleX = -(((now - EPOCH) / 1000) * PX_PER_SECOND) + NOW_OFFSET_PX;
  $: ticks = Array.from({ length: 49 }, (_, i) => EPOCH + i * 30 * 60 * 1000); // every 30 minutes

  const leftPx = (timeMs) => {
    return ((timeMs - EPOCH) / 1000) * PX_PER_SECOND;
  };
  const widthPx = (durationSeconds) => {
    return durationSeconds * PX_PER_SECOND;
  };

  const catColors = {
    Literature: "green",
    Music: "red",
    News: "blue",
    History: "yellow",
    STEM: "purple",
    Misc: "gray",
    Sports: "teal",
    Entertainment: "orange",
  };

  onMount(async () => {
    const date = new Date();
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    dateString = `${day}-${month}-${year}`;

    const radioData = await import(`../data/${dateString}-radio-data.json`);
    radio = radioData.default.map((station) => ({
      ...station,
      color: catColors[station.category],
    }));
    loading = false;

    // start live timer for "now" and scrolling
    guideTimer = createTimer({
      onUpdate: () => {
        now = Date.now();
      },
    });
  });
</script>

<!-- <div class="{Object.entries(catColors).map(([cat, color]) => Array.from({length: 8}, (_, i) => `bg-${color}-${(i + 1) * 100}`).join(' ')).join(' ')}"></div>
<div class="{Object.entries(catColors).map(([cat, color]) => Array.from({length: 8}, (_, i) => `text-${color}-${(i + 1) * 100}`).join(' ')).join(' ')}"></div>
<div class="{Object.entries(catColors).map(([cat, color]) => Array.from({length: 8}, (_, i) => `border-${color}-${(i + 1) * 100}`).join(' ')).join(' ')}"></div> -->
<!-- <div class="hidden bg-green-100 bg-green-200 bg-green-300 bg-green-400 bg-green-500 bg-green-600 bg-green-700 bg-green-800 bg-red-100 bg-red-200 bg-red-300 bg-red-400 bg-red-500 bg-red-600 bg-red-700 bg-red-800 bg-blue-100 bg-blue-200 bg-blue-300 bg-blue-400 bg-blue-500 bg-blue-600 bg-blue-700 bg-blue-800 bg-yellow-100 bg-yellow-200 bg-yellow-300 bg-yellow-400 bg-yellow-500 bg-yellow-600 bg-yellow-700 bg-yellow-800 bg-purple-100 bg-purple-200 bg-purple-300 bg-purple-400 bg-purple-500 bg-purple-600 bg-purple-700 bg-purple-800 bg-gray-100 bg-gray-200 bg-gray-300 bg-gray-400 bg-gray-500 bg-gray-600 bg-gray-700 bg-gray-800 bg-teal-100 bg-teal-200 bg-teal-300 bg-teal-400 bg-teal-500 bg-teal-600 bg-teal-700 bg-teal-800 bg-orange-100 bg-orange-200 bg-orange-300 bg-orange-400 bg-orange-500 bg-orange-600 bg-orange-700 bg-orange-800"></div> -->
<!-- <div class="text-green-100 text-green-200 text-green-300 text-green-400 text-green-500 text-green-600 text-green-700 text-green-800 text-red-100 text-red-200 text-red-300 text-red-400 text-red-500 text-red-600 text-red-700 text-red-800 text-blue-100 text-blue-200 text-blue-300 text-blue-400 text-blue-500 text-blue-600 text-blue-700 text-blue-800 text-yellow-100 text-yellow-200 text-yellow-300 text-yellow-400 text-yellow-500 text-yellow-600 text-yellow-700 text-yellow-800 text-purple-100 text-purple-200 text-purple-300 text-purple-400 text-purple-500 text-purple-600 text-purple-700 text-purple-800 text-gray-100 text-gray-200 text-gray-300 text-gray-400 text-gray-500 text-gray-600 text-gray-700 text-gray-800 text-teal-100 text-teal-200 text-teal-300 text-teal-400 text-teal-500 text-teal-600 text-teal-700 text-teal-800 text-orange-100 text-orange-200 text-orange-300 text-orange-400 text-orange-500 text-orange-600 text-orange-700 text-orange-800"></div>
<div class="border-green-100 border-green-200 border-green-300 border-green-400 border-green-500 border-green-600 border-green-700 border-green-800 border-red-100 border-red-200 border-red-300 border-red-400 border-red-500 border-red-600 border-red-700 border-red-800 border-blue-100 border-blue-200 border-blue-300 border-blue-400 border-blue-500 border-blue-600 border-blue-700 border-blue-800 border-yellow-100 border-yellow-200 border-yellow-300 border-yellow-400 border-yellow-500 border-yellow-600 border-yellow-700 border-yellow-800 border-purple-100 border-purple-200 border-purple-300 border-purple-400 border-purple-500 border-purple-600 border-purple-700 border-purple-800 border-gray-100 border-gray-200 border-gray-300 border-gray-400 border-gray-500 border-gray-600 border-gray-700 border-gray-800 border-teal-100 border-teal-200 border-teal-300 border-teal-400 border-teal-500 border-teal-600 border-teal-700 border-teal-800 border-orange-100 border-orange-200 border-orange-300 border-orange-400 border-orange-500 border-orange-600 border-orange-700 border-orange-800"></div> -->

{#if loading}
  <div
    class="w-1/2 bg-gray-100 p-2 rounded-lg text-gray-700 h-96 flex flex-col"
  >
    <h1 class="text-sm">Loading...</h1>
  </div>
{:else}
  <div
    class="w-1/2 bg-gray-100 p-2 rounded-lg text-gray-700 h-[34rem] flex flex-col"
  >
    <h1 class="text-sm">
      Hello! It's {new Date(
        dateString.split("-").reverse().join("-"),
      ).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}. Here's the
      <span
        class="font-bold bg-gradient-to-tr from-orange-500 to-orange-400 inline-block text-transparent bg-clip-text"
        >daily program</span
      > for radIO ~
    </h1>
    <div class="flex flex-col gap-2 mt-4 bg-gray-200 rounded-lg p-3 h-full">
      <!-- Category chips -->
      <div
        class="flex flex-row gap-2 mb-1 cursor-default bg-gradient-to-tr from-gray-300 to-gray-500 rounded-lg p-1 overflow-x-auto hide-scrollbar"
      >
        {#each Object.entries(catColors) as [cat, color]}
          <div
            class="flex items-center justify-center text-xs w-fit text-{color}-100 bg-{color}-500 border-2 border-{color}-600 px-2 py-1 rounded-xl"
          >
            <h2>{cat}</h2>
          </div>
        {/each}
      </div>

      <!-- TV Guide -->
      <div class="relative bg-white rounded-lg border border-gray-300 h-full">
        <!-- Now marker overlay -->
        <div
          class="pointer-events-none absolute top-0 bottom-0 z-10"
          style="left: {NOW_OFFSET_PX}px"
        >
          <div class="w-[2px] h-full bg-red-500/70"></div>
        </div>

        <!-- Header with time ticks aligned to timeline -->
        <div
          class="grid border-b border-gray-200"
          style="grid-template-columns: 12rem 1fr; height: {TICK_BAR_HEIGHT}px"
        >
          <div></div>
          <div class="relative overflow-hidden">
            <div
              class="absolute top-0 left-0 will-change-transform"
              style="width: {scheduleWidth}px; transform: translateX({scheduleX}px)"
            >
              {#each ticks as t}
                <div
                  class="absolute top-0 h-full border-l border-gray-300 text-[10px] text-gray-600 pl-1"
                  style="left: {leftPx(t)}px"
                >
                  {new Date(t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Rows: station chips aligned with timeline columns -->
        <div
          class="overflow-y-auto"
          style="height: calc(100% - {TICK_BAR_HEIGHT}px)"
        >
          {#each radio as station, i}
            <div
              class="grid border-b border-gray-100"
              style="grid-template-columns: 12rem 1fr; height: {ROW_HEIGHT}px"
            >
              <!-- Station chip/label -->
              <div class="flex items-center pl-2 text-sm text-gray-800">
                <span class="font-medium">{station.name}</span>
                <span class="ml-2 text-xs text-gray-500"
                  >{station.frequency.toFixed(1)}</span
                >
              </div>
              <!-- Timeline row for this station -->
              <div class="relative overflow-hidden">
                <div
                  class="relative will-change-transform"
                  style="width: {scheduleWidth}px; transform: translateX({scheduleX}px)"
                >
                  {#each station.items as item}
                    <div
                      class="absolute rounded-sm text-[10px] overflow-hidden text-white flex items-center px-1"
                      style="left: {leftPx(item.startTime)}px; width: {widthPx(
                        item.duration,
                      )}px; height: {ROW_HEIGHT -
                        8}px; top: 4px; background-color: rgba(0,0,0,0.4)"
                    >
                      <span class="truncate">{item.title}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

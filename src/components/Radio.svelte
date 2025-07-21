<script>
  import { onMount } from "svelte";
  import { animate } from "animejs";

  let frequency = 101.2;
  let power = false;
  let audioBooted = false;
  let audioElements = [];
  let radio = [];
  let loading = true;

  // Dynamic import of radio data
  onMount(async () => {
    const date = new Date();
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const dateString = `${day}-${month}-${year}`;

    try {
      const radioData = await import(`../data/${dateString}-radio-data.json`);
      radio = radioData.default;
      loading = false;
    } catch (error) {
      console.error("Failed to load radio data:", error);
      // Fallback to a default file or handle the error
      loading = false;
    }
    station = getStation(frequency);
  });

  const SEED = "radIO";

  const getStation = (frequency) => {
    return radio.find((station) => station.frequency === frequency);
  };

  $: station = getStation(frequency);

  // Calculate volume based on frequency distance
  function calculateVolume(stationFrequency) {
    const distance = Math.abs(frequency - stationFrequency);
    const volume = -Math.log(distance + 1) + 1;
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    return clampedVolume;
  }

  // Update volumes for all radio stations
  function updateVolumes() {
    if (audioBooted && radio.length > 0) {
      let totalStationVolume = 0;

      // Update radio station volumes and calculate total
      radio.forEach((station, index) => {
        if (audioElements[index]) {
          const volume = calculateVolume(station.frequency);
          audioElements[index].volume = volume;
          totalStationVolume += volume;
        }
      });

      // Update white noise volume (inversely proportional to station volumes)
      const whiteNoiseIndex = radio.length; // White noise is the last audio element
      if (audioElements[whiteNoiseIndex]) {
        const whiteNoiseVolume = Math.max(0, 1 - totalStationVolume);
        audioElements[whiteNoiseIndex].volume = whiteNoiseVolume;
      }
    }
  }

  // Reactive statement to update volumes when frequency changes
  $: frequency;
  $: {
    const _ocl = console.warn;
    console.warn = () => {};
    console.warn(frequency.toFixed(1) * 0);
    console.warn = _ocl;

    // console.log("audioBooted", audioBooted);
    // console.log("audioElements.length", audioElements.length);

    // (frequency) => {alert(frequency)}

    if (audioBooted && audioElements.length > 0) {
      updateVolumes();
    }
  }

  // Refactored function to load and play the correct audio item for a station
  function loadAndPlayStationAudio(audio, station, bootTime) {
    if (!station || !station.items || station.items.length === 0) return;

    // Find the item that is supposed to be playing right now
    const now = Date.now();
    const item = station.items.findLast((item) => item.startTime <= now);
    if (!item) return;

    // How many seconds have passed since the item was supposed to start?
    const timeSinceStart = (now - item.startTime) / 1000;
    const remaining = Math.max(0, item.duration - timeSinceStart);

    // Set the source element to the correct stream url
    audio.querySelector("source").src = item.streamUrl;
    audio.currentTime = timeSinceStart;
    audio.load();

    if (power) {
      audio.muted = false;
    } else {
      audio.muted = true;
    }

    audio.play().catch((error) => {
      console.error("Playback failed:", error);
    });

    // Clear any previous timeout
    if (audio._nextTimeout) {
      clearTimeout(audio._nextTimeout);
    }
    // Set a timeout to load the next item when this one ends
    audio._nextTimeout = setTimeout(() => {
      loadAndPlayStationAudio(audio, station, bootTime);
    }, remaining * 1000);
  }

  function handlePowerToggle() {
    if (!audioBooted) {
      // First time: boot up audio elements
      power = true;
      audioBooted = true;
      const bootTime = Date.now();

      // Start all audio elements
      audioElements.forEach((audio) => {
        if (audio) {
          // console.log("Booting audio element", audio);

          if (audio.dataset.stationIdentifier) {
            // Get correct stream url and start offset
            const stationIdentifier = audio.dataset.stationIdentifier;
            const station = radio.find(
              (station) => station.identifier === stationIdentifier,
            );

            if (!station) {
              console.error("Station not found", stationIdentifier);
              return;
            }

            loadAndPlayStationAudio(audio, station, bootTime);
          } else {
            // White noise or other non-station audio
            audio.muted = false;
            audio.play().catch((error) => {
              console.error("Playback failed:", error);
            });
          }
        }
      });

      // Update volumes after booting
      setTimeout(() => updateVolumes(), 100);
    } else {
      // Subsequent times: just toggle mute
      power = !power;

      // Mute/unmute all audio elements
      audioElements.forEach((audio) => {
        if (audio) {
          audio.muted = !power;
        }
      });
    }
  }

  // Action to store audio element references
  const audioAction = (node) => {
    audioElements.push(node);

    // If already booted and powered, start this audio element
    if (audioBooted && power) {
      node.muted = false;
      node.play().catch((error) => {
        console.log("Playback failed:", error);
      });
    }
  };
</script>

{#if loading}
  <div class="flex flex-col gap-4 p-4 w-full">
    <p class="text-xl">Loading radio data...</p>
  </div>
{:else}
  <div class="flex flex-col gap-4 p-4 w-full">
    <div class="flex items-center">
      <input
        type="button"
        on:click={handlePowerToggle}
        value="⏻"
        class="mr-3 bg-gray-200 border-2 rounded p-1 text-sm leading-3.5 {!power
          ? 'text-gray-400 border-gray-300'
          : 'text-gray-600 border-gray-400 shadow-2xl'} cursor-pointer"
      />

      <input
        type="button"
        on:click={(frequency -= 0.1)}
        value="◀"
        class="mr-3 bg-gray-200 border-2 rounded p-1 text-sm leading-3.5 {!power
          ? 'text-gray-400 border-gray-300'
          : 'text-gray-600 border-gray-400 shadow-2xl'} cursor-pointer"
      />
      <input
        type="button"
        on:click={(frequency += 0.1)}
        value="▶"
        class="mr-3 bg-gray-200 border-2 rounded p-1 text-sm leading-3.5 {!power
          ? 'text-gray-400 border-gray-300'
          : 'text-gray-600 border-gray-400 shadow-2xl'} cursor-pointer"
      />

      <!-- <input
            type="button"
            on:click={frequency = }
            value="⏮"
            class="mr-3 bg-gray-200 border-2 rounded p-1 text-sm leading-3.5 {!power
                ? 'text-gray-400 border-gray-300'
                : 'text-gray-600 border-gray-400 shadow-2xl'} cursor-pointer"
        /> -->

      <label class="text-xl" for="frequency-input">
        {frequency.toFixed(1)}
        <span class="text-sm text-gray-500">{station?.name}</span>
      </label>
    </div>

    <input
      type="range"
      min="55"
      max="155"
      step="0.1"
      bind:value={frequency}
      class="h-2 w-full md:w-1/2 lg:w-1/4 appearance-none bg-gray-200 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:bg-orange-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-none"
      id="frequency-input"
    />

    {#each radio as station}
      <!-- <div>{station.identifier}</div> -->
      <audio
        use:audioAction
        muted={!power}
        preload="auto"
        data-station-identifier={station.identifier}
      >
        <source type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    {/each}
    <audio use:audioAction muted={!power} preload="auto" loop>
      <source
        src="https://archive.org/download/White_Noise-14496/White_Noise_-_01_-_White_Noise.mp3"
        type="audio/mpeg"
      />
      Your browser does not support the audio element.
    </audio>
  </div>
{/if}

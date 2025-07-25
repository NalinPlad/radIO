<script>
  import { onMount } from "svelte";
  import { createDraggable, createTimer, utils } from "animejs";

  let frequency = 55.0;
  let power = false;
  let audioBooted = false;
  let audioElements = [];
  let radio = [];
  let loading = true;
  // AnimeJS
  let fr_ind;
  let fr_tmobj;
  let fr_smooth_track;

  let mouseY = 0;
  let bootedStations = new Set();

  // Dynamic import of radio data
  onMount(async () => {
    // document.addEventListener("mousemove", (e) => {
    //   mouseY = e.clientY;
    // });

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

    // --- Reload page at the end of the UTC day ---
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDate = now.getUTCDate();
    // Start of next UTC day
    const nextDay = new Date(
      Date.UTC(utcYear, utcMonth, utcDate + 1, 0, 0, 0, 0),
    );
    // TODO use timer and show display
    const msUntilNextDay = nextDay.getTime() - now.getTime();
    setTimeout(() => {
      window.location.reload();
    }, msUntilNextDay);
    // --- End reload logic ---

    function onDrag() {
      // console.clear()
      console.log(fr_ind.progressX)
      // console.log(fr_ind.containerBounds[1], fr_ind.x)

      // drag speed goes down to 0.2 is the user is not hovering over the object
      // fr_ind.dragSpeed = Math.min(
      //   1,
      //   Math.max(
      //     0.1,
      //     1 -
      //       (mouseY -
      //         (fr_ind.$target.getBoundingClientRect().y +
      //           fr_ind.$target.getBoundingClientRect().height / 2)) /
      //         (fr_ind.$target.getBoundingClientRect().height * 3),
      //   ),
      // );
      // console.log(fr_ind.x)

      frequency = utils.round(
        Math.max(55, Math.min(155, fr_ind.progressX * 100 + 55)),
        1,
      ) - 1.3;
    }

    function getSnapXValue() {
      const minX = -26;
      const maxX = fr_ind.containerBounds[1];
      // const maxX = document.querySelector("#fr_ind_container").getBoundingClientRect().width;
      // console.log(maxX_o, maxX)

      const travel = maxX - minX;
      const snapX = Math.abs(travel / (radio.length-1));

      return snapX;
    }
    function setSnapX() {
      
      // width of target
      const snapX = getSnapXValue();

      fr_ind.stop();
      fr_ind.disable();

      fr_ind = createDraggable("#fr_ind", {
        y: false,
        container: "#fr_ind_container",
        // containerPadding: -18.4,
        containerFriction: 0.9,
        maxVelocity: 0,
        releaseStiffness: 1000,
        // dragSpeed: 1,
        modifier: utils.snap(snapX),
        onDrag: onDrag,
        onSettle: onDrag,
        onAfterResize: setSnapX,
        // releaseEase: createSpring(1000, 100),
      });

      fr_ind.snapX = snapX;



    }

    let snapX = 0;

    fr_ind = createDraggable("#fr_ind", {
      x: false,
      y: false,
      container: "#fr_ind_container",
    });

    snapX = getSnapXValue();
    

    
    setSnapX();
    fr_ind.progressX = 0;

    [fr_smooth_track] = utils.$("#fr_smooth_track")

    fr_tmobj = createTimer({
        onUpdate: clock => {
          const sourcePos = utils.get(fr_smooth_track, 'x', false)
          const targetPos = utils.get(fr_ind, 'x', false) + 20
          utils.set(fr_smooth_track, {
            x: utils.lerp(sourcePos, targetPos, .2)
          })
        }
    })

  });

  const SEED = "radIO";

  const getStation = (frequency) => {
    // console.log(frequency)
    return radio.find((station) => Math.abs(station.frequency - frequency) < 3);
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
          // console.log(
          //   station,
          //   audioElements[index].querySelector("source").src,
          // );
          const volume = calculateVolume(station.frequency);
          audioElements[index].volume = volume;
          totalStationVolume += volume;
        }
      });

      // Update white noise volume (inversely proportional to station volumes)
      const whiteNoiseVolume = Math.max(0, 0.5 - totalStationVolume);
      if (whiteNoiseAudio) {
        whiteNoiseAudio.volume = whiteNoiseVolume;
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
    console.log("loadAnd");
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

  $: scroller = loading
    ? "Loading radio data..."
    : !power
      ? "⠠⠗⠁⠝⠙⠕⠍ radIO is OFF (⏻) ⠎⠞⠗⠊⠝⠛⠎"
      : (station?.items?.find((item) => item.startTime <= Date.now())?.title ??
        station?.name ??
        "⠠⠗⠁⠝⠙⠕⠍ Tune radIO ⠎⠞⠗⠊⠝⠛⠎");

  function handlePowerToggle() {
    if (!audioBooted) {
      power = true;
      audioBooted = true;
      const bootTime = Date.now();

      // Only boot the current station
      if (station && !bootedStations.has(station.identifier)) {
        const idx = radio.findIndex((s) => s.identifier === station.identifier);
        const audio = audioElements[idx];
        if (audio) {
          loadAndPlayStationAudio(audio, station, bootTime);
          bootedStations.add(station.identifier);
        }
      }
      // Start white noise audio
      if (whiteNoiseAudio) {
        whiteNoiseAudio.muted = false;
        whiteNoiseAudio.play().catch((error) => {
          console.error("Playback failed:", error);
        });
      }
      setTimeout(() => updateVolumes(), 100);
    } else {
      power = !power;
      // Mute/unmute all booted audio elements
      radio.forEach((station, index) => {
        if (audioElements[index] && bootedStations.has(station.identifier)) {
          audioElements[index].muted = !power;
        }
      });
      if (whiteNoiseAudio) {
        whiteNoiseAudio.muted = !power;
      }
    }
  }

  // When tuning to a new station, boot it if needed
  $: if (
    audioBooted &&
    power &&
    station &&
    !bootedStations.has(station.identifier)
  ) {
    const idx = radio.findIndex((s) => s.identifier === station.identifier);
    const audio = audioElements[idx];
    if (audio) {
      loadAndPlayStationAudio(audio, station, Date.now());
      bootedStations.add(station.identifier);
    }
  }

  // Action to store audio element references
  let whiteNoiseAudio = null;
  const audioAction = (node) => {
    if (node.dataset.stationIdentifier) {
      audioElements.push(node);
      // Only auto-play if already booted
      const identifier = node.dataset.stationIdentifier;
      if (audioBooted && power && bootedStations.has(identifier)) {
        node.muted = false;
        node.play().catch((error) => {
          console.log("Playback failed:", error);
        });
      }
    } else {
      // This is the white noise audio element
      whiteNoiseAudio = node;
      if (audioBooted && power) {
        node.muted = false;
        node.play().catch((error) => {
          console.log("Playback failed:", error);
        });
      }
    }
  };
</script>

<div class="flex flex-col gap-4 p-6 w-md rounded-lg shadow-[-50px_50px_37px_-31px_rgb(229,_231,_235)] bg-gradient-to-tr from-white via-white to-gray-200">
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
    <div
      class="w-full flex flex-col px-3"
    >
      <label class="text-xl" for="frequency-input">
        {frequency.toFixed(1)}
        <span class="text-sm text-gray-500">{station?.name}</span>
      </label>
      <div class="relative">
        <div
          class="absolute left-0 w-12 h-full bg-gradient-to-r from-white to-transparent z-10"
        ></div>
        <marquee
          class="text-sm text-gray-500 font-stretch-75% border-2 border-gray-200 rounded-sm"
          >{scroller}</marquee
        >
      </div>
    </div>
  </div>
  <div
    id="fr_ind_container"
    class="h-5 w-full bg-gray-100 rounded flex items-center justify-between px-6.5"
  >
    {#each radio as station}
      <div
        class="h-4 rounded bg-gradient-to-tr from-gray-400 via-gray-300 to-gray-200 w-1"
      ></div>
    {/each}
    <div
      id="fr_ind"
      class="fixed h-8 w-14 border-orange-500 border-3 opacity-0 flex items-center justify-center z-10"
    ></div>

    <div 
      id="fr_smooth_track"
      class="fixed h-8 w-2 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-orange-300"
    ></div>
  </div>

  <input
    type="range"
    min="55"
    max="155"
    step="0.1"
    bind:value={frequency}
    class="hidden appearance-none bg-gray-200 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:bg-orange-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-none"
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

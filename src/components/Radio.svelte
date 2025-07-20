<script>
    import radioData from "../data/radio-data.json";

    let frequency = 101.2;
    let power = false;
    let audioBooted = false;
    let audioElements = [];

    const SEED = "radIO";

    // Use pre-generated radio data
    let radio = radioData;
    let loading = false;

    const getStation = (frequency) => {
        return radio.find((station) => station.frequency === frequency);
    };

    $: station = getStation(frequency);

    function handlePowerToggle() {
        if (!audioBooted) {
            // First time: boot up audio elements
            power = true;
            audioBooted = true;

            // Start all audio elements
            audioElements.forEach((audio) => {
                if (audio) {
                    audio.muted = false;
                    audio.play().catch((error) => {
                        console.log("Playback failed:", error);
                    });
                }
            });
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
        <label class="text-xl" for="frequency-input">
            {frequency.toFixed(1)}
            <span class="text-sm text-gray-500">{station?.name}</span>
        </label>
    </div>

    <input
        type="range"
        min="77"
        max="111"
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
        >
            <source src={station.streamUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
        </audio>
    {/each}
    <audio
        use:audioAction
        muted={!power}
        preload="auto"
        loop
    >
        <source src="https://archive.org/download/White_Noise-14496/White_Noise_-_01_-_White_Noise.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
    </audio>
</div>

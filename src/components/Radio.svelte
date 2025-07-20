<script>
    let frequency = 101.2;
    let power = false;

    const SEED = "radIO";

    // Static data to build the radio from
    const STATIONS = [
        {
            name: "BookCentral",
            frequency: 101.2,
            identifier: "radiobooks",
        },
        {
            name: "Concert Grande WFUV",
            frequency: 89.7,
            identifier: "concert-grande-radio",
        },
    ];

    const SEARCH_URL = (collection) => `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+mediatype:audio+AND+format:MP3&rows=5&output=json`;

    // Dynamic data for radio
    let radio = [];
    let loading = true;
    let error = undefined;

    async function getStreamUrl(identifier) {
        const metadata = await fetch("https://archive.org/metadata/" + identifier).then(res => res.json())
        const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(metadata.files.find(file => file.format.includes("MP3")).name)}`
        // console.log(streamUrl)
        return streamUrl
    }

    // Load radio data on component mount
    // (async () => {
    //     const radioData = await Promise.all(
    //         STATIONS.map(async (station) => {
    //             // Get list of items in the collection
    //             const response = await fetch(SEARCH_URL(station.identifier))
    //                 .then((res) => res.json())
    //                 .then((data) => data.response.docs);
    //             const items = response.map((item) => {
    //                 return {
    //                     identifier: item.identifier,
    //                     title: item.title
    //                 }
    //             });
    //             console.log(items);
    //             const streamUrl = await getStreamUrl(items[0].identifier)
    //             return {
    //                 name: station.name,
    //                 frequency: station.frequency,
    //                 identifier: station.identifier,
    //                 items: items,
    //                 streamUrl: streamUrl
    //             };
    //         }),
    //     ).catch((err) => {
    //         error = err;
    //     });

    //     radio = radioData;
    //     loading = false;
    //     console.log("Radio data loaded:", radio);
    // })();

    const getStation = (frequency) => {
        return STATIONS.find((station) => station.frequency === frequency);
    };

    $: station = getStation(frequency);
    // $: console.log(station);
</script>


{#if error}
    <div class="flex flex-col gap-4 p-4 w-full">
        <p class="text-xl">Error loading radio stations: {error}</p>
    </div>
{:else}
    <div class="flex flex-col gap-4 p-4 w-full">
        {#if loading}
            <div class="flex flex-col gap-4 p-4 w-full">
                <p class="text-sm text-gray-500">Loading {STATIONS.length} radio stations...</p>
            </div>
        {/if}
        
        <div class="flex items-center">
            <input type="button" on:click={() => power = !power} value="⏻" class="mr-3 bg-gray-200 border-2 rounded p-1 text-sm leading-3.5 {!power ? 'text-gray-400 border-gray-300' : 'text-gray-600 border-gray-400 shadow-2xl'} cursor-pointer">
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
        <div>{station.identifier}</div>
            <audio autoplay muted={!power} class="w-full md:w-1/2 lg:w-1/4">
                <source src={station.streamUrl} type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        {/each}

        <!-- <iframe src="https://archive.org/embed/radiobooks&amp;autoplay=1" width="500" height="300" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe> -->
    </div>
{/if}

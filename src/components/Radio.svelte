<script>
    let frequency = 101.2;
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

    const SEARCH_URL = (collection) =>
        `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+mediatype:audio+AND+format:MP3&rows=5&output=json`;

    // Dynamic data for radio
    let radio = [];
    let loading = true;
    let error = undefined;

    async function getStreamUrl(identifier) {
        const metadata = await fetch("https://archive.org/metadata/" + identifier).then(res => res.json())
        const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(metadata.files.find(file => file.format.includes("MP3")).name)}`
        console.log(streamUrl)
    }

    // Load radio data on component mount
    (async () => {
        const radioData = await Promise.all(
            STATIONS.map(async (station) => {
                // Get list of items in the collection
                const response = await fetch(SEARCH_URL(station.identifier))
                    .then((res) => res.json())
                    .then((data) => data.response.docs);
                const items = response.map((item) => {
                    return {
                        identifier: item.identifier,
                        title: item.title
                    }
                });
                console.log(items);
                const streamUrl = await getStreamUrl(items[0].identifier)
                return {
                    name: station.name,
                    frequency: station.frequency,
                    identifier: station.identifier,
                    items: items,
                };
            }),
        ).catch((err) => {
            error = err;
        });

        radio = radioData;
        loading = false;
        console.log("Radio data loaded:", radio);
    })();

    const getStation = (frequency) => {
        return STATIONS.find((station) => station.frequency === frequency);
    };

    $: station = getStation(frequency);
    // $: console.log(station);
</script>

{#if loading}
    <div class="flex flex-col gap-4 p-4 w-full">
        <p class="text-xl">Loading {STATIONS.length} radio stations...</p>
    </div>
{:else if error}
    <div class="flex flex-col gap-4 p-4 w-full">
        <p class="text-xl">Error loading radio stations: {error}</p>
    </div>
{:else}
    <div class="flex flex-col gap-4 p-4 w-full">
        <label class="text-xl" for="frequency-input">
            {frequency.toFixed(1)}
            <span class="text-sm text-gray-500">{station?.name}</span>
        </label>
        <input
            type="range"
            min="77"
            max="111"
            step="0.1"
            bind:value={frequency}
            class="h-2 w-full md:w-1/2 lg:w-1/4 appearance-none bg-gray-200 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:bg-orange-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-none"
            id="frequency-input"
        />
        <!-- <iframe src="https://archive.org/embed/radiobooks&amp;autoplay=1" width="500" height="300" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe> -->
    </div>
{/if}

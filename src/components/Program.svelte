<script>
    import { onMount } from "svelte";

    let radio = [];
    let loading = true;
    let dateString = "";


    const catColors = {
        "Literature": "green",
        "Music": "red",
        "News": "blue",
        "History": "yellow",
        "STEM": "purple",
        "Misc": "gray",
        "Sports": "teal",
        "Entertainment": "orange",
    }

    onMount(async () => {
        const date = new Date();
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        dateString = `${day}-${month}-${year}`;

        const radioData = await import(`../data/${dateString}-radio-data.json`);
        radio = radioData.default.map(station => ({
            ...station,
            color: catColors[station.category]
        }));
        loading = false;

        console.log(radio);
    });
</script>

<!-- <div class="{Object.entries(catColors).map(([cat, color]) => Array.from({length: 8}, (_, i) => `bg-${color}-${(i + 1) * 100}`).join(' ')).join(' ')}"></div> -->
<!-- <div class="hidden bg-green-100 bg-green-200 bg-green-300 bg-green-400 bg-green-500 bg-green-600 bg-green-700 bg-green-800 bg-red-100 bg-red-200 bg-red-300 bg-red-400 bg-red-500 bg-red-600 bg-red-700 bg-red-800 bg-blue-100 bg-blue-200 bg-blue-300 bg-blue-400 bg-blue-500 bg-blue-600 bg-blue-700 bg-blue-800 bg-yellow-100 bg-yellow-200 bg-yellow-300 bg-yellow-400 bg-yellow-500 bg-yellow-600 bg-yellow-700 bg-yellow-800 bg-purple-100 bg-purple-200 bg-purple-300 bg-purple-400 bg-purple-500 bg-purple-600 bg-purple-700 bg-purple-800 bg-gray-100 bg-gray-200 bg-gray-300 bg-gray-400 bg-gray-500 bg-gray-600 bg-gray-700 bg-gray-800 bg-teal-100 bg-teal-200 bg-teal-300 bg-teal-400 bg-teal-500 bg-teal-600 bg-teal-700 bg-teal-800 bg-orange-100 bg-orange-200 bg-orange-300 bg-orange-400 bg-orange-500 bg-orange-600 bg-orange-700 bg-orange-800"></div> -->


{#if loading}
    <div class="w-1/2 bg-gray-100 p-2 rounded-lg text-gray-700 h-96 flex flex-col">
        <h1 class="text-sm">Loading...</h1>
    </div>
{:else}
    <div class="w-1/2 bg-gray-100 p-2 rounded-lg text-gray-700 h-96 flex flex-col">
        <h1 class="text-sm">Hello! It's {new Date(dateString.split('-').reverse().join('-')).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}. Here's the <span class="font-bold bg-gradient-to-tr from-orange-500  to-orange-400 inline-block text-transparent bg-clip-text">daily program</span> for radIO ~</h1>
        <div class="flex flex-col gap-0.5 mt-4 overflow-y-scroll max-h-full bg-gray-200 rounded-lg p-3">
            {#each radio as station}
                <div class="flex flex-col w-32 text-{station.color}-100 bg-{station.color}-400 border-5 border-{station.color}-500 p-3 rounded-xl">
                    <h2>
                        <span class="font-bold text-sm ">{station.name}</span>
                        <span class="font-bold text-xs  bg-black/5 p-0.5 rounded">{station.frequency.toFixed(1)}</span>
                    </h2>
                </div>
                <!-- {#each station.items as item}
                    <div>{item.title}</div>
                {/each} -->
            {/each}
        </div>
    </div>
{/if}
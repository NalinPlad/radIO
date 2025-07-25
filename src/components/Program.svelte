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

<div class="hidden {Object.entries(catColors).map(([cat, color]) => Array.from({length: 8}, (_, i) => `bg-${color}-${(i + 1) * 100}`).join(' ')).join(' ')}"></div>

{#if loading}
    <div class="w-1/2 bg-gray-100 p-2 rounded-lg text-gray-700 h-96 flex flex-col">
        <h1 class="text-sm">Loading...</h1>
    </div>
{:else}
    <div class="w-1/2 bg-gray-100 p-2 rounded-lg text-gray-700 h-96 flex flex-col">
        <h1 class="text-sm">Hello! It's {new Date(dateString.split('-').reverse().join('-')).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}. Here's the <span class="font-bold bg-gradient-to-tr from-orange-500  to-orange-400 inline-block text-transparent bg-clip-text">daily program</span> for radIO ~</h1>
        <div class="flex flex-col gap-0.5 mt-4 overflow-y-scroll max-h-full bg-gray-200 rounded-lg p-3">
            {#each radio as station}
                <div class="flex flex-col w-32 bg-{station.color}-400 border-5 border-{station.color}-500 p-3 rounded-xl">
                    <h2>
                        <span class="font-bold text-sm text-red-100">{station.name}</span>
                        <span class="font-bold text-xs text-red-200 bg-black/5 p-0.5 rounded">{station.frequency.toFixed(1)}</span>
                    </h2>
                </div>
                <!-- {#each station.items as item}
                    <div>{item.title}</div>
                {/each} -->
            {/each}
        </div>
    </div>
{/if}
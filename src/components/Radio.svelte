<script>
    let frequency = 101.2;
    const SEED = "radIO";
    
    const STATIONS = [{
        name: "BookCentral",
        frequency: 101.2,
        identifier: 'radiobooks'
    }]

    const getStation = (frequency) => {
        return STATIONS.find(station => station.frequency === frequency);
    }

    $: station = getStation(frequency);
    $: console.log(station);
</script>

<div class="flex flex-col gap-4 p-4 w-full">
    <label class="text-xl" for="frequency-input">
        {frequency.toFixed(1)} <span class="text-sm text-gray-500">{station?.name}</span>
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


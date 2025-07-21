const fs = require("fs");
const path = require("path");

// current time
const EPOCH = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();

// Static data to build the radio from
const STATION_CONFIGS = [
  { name: "BookCentral", identifier: "radiobooks" },
  { name: "Concert Grande WFUV", identifier: "concert-grande-radio" },
  { name: "Crap From The Past", identifier: "crapfromthepast" },
  { name: "NPR Top of the Hour", identifier: "nprtopofthehour" },
  { name: "BBC World Service", identifier: "Radio-BBC-World-Service" },
  { name: "MixTape Central", identifier: "hiphopmixtapes" },
  { name: "HipHop Radio", identifier: "hiphopradioarchive" },
  { name: "VaporRadio", identifier: "vaporwave"},
  { name: "Democracy Now!", identifier: "democracy_now"},
  { name: "WWII News Radio", identifier: "wwIIarchive-audio"},
  { name: "Executive Speech", identifier: "presidential_recordings"},
  { name: "NASA Space Channel", identifier: "audiohighlightreels"},
  { name: "Hacker Public Radio", identifier: "hackerpublicradio"},
  { name: "Transatlantic Poetry Show", identifier: "transatlantic-poetry"},
  // { name: "Opera Channel", identifier: "78-opera"}
];

const FREQ_MIN = 55;
const FREQ_MAX = 155;
const N = STATION_CONFIGS.length;
const SPACING = (FREQ_MAX - FREQ_MIN) / (N - 1);

const STATIONS = STATION_CONFIGS.map((cfg, i) => ({
  ...cfg,
  frequency: Math.round((FREQ_MIN + i * SPACING) * 10) / 10,
}));

const SEARCH_URL = (collection) =>
  `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+mediatype:audio+AND+format:MP3&rows=9999&output=json`;

async function getFileInfo(identifier) {
  const metadata = await fetch(
    "https://archive.org/metadata/" + identifier
  ).then((res) => res.json());

  // random file from the list
  const mp3s = metadata.files.filter((file) => file.format.includes("MP3"));
  const file = mp3s[Math.floor(Math.random() * mp3s.length)];

  const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(
    file.name
  )}`;

  const duration = file.length.includes(":")
    ? file.length.split(":").reduce((acc, curr, index) => {
        return acc + curr * (index === 0 ? 60 : 1);
      }, 0)
    : Number(file.length);

  return { streamUrl, duration };
}

async function generateRadioData() {
  console.log("Generating radio data...");

  try {
    const radioData = await Promise.all(
      STATIONS.map(async (station) => {
        console.log(`Fetching data for ${station.name}...`);

        // Get list of items in the collection
        const response = await fetch(SEARCH_URL(station.identifier))
          .then((res) => res.json())
          .then((data) => data.response.docs);

        const collection_items = response
          .sort(() => Math.random() - 0.5)
          .map((item) => {
            return {
              identifier: item.identifier,
              title: item.title,
            };
          });

        console.log(
          `Found ${collection_items.length} items for ${station.name}`
        );

        let totalDuration = 0;

        let items = [];

        while (totalDuration < 24 * 60 * 60 && collection_items.length > 0) {
          const { streamUrl, duration } = await getFileInfo(
            collection_items[0].identifier
          );

          if (duration === -1) {
            console.error(
              `Skipping file ${collection_items[0].identifier} due to parsing failure`
            );
            collection_items.shift(); // Remove the failed item
            continue;
          }

          // console.log(`Added ${duration} seconds to total duration, now at ${totalDuration} seconds`);
          items.push(collection_items.shift());
          items[items.length - 1].duration = duration;
          items[items.length - 1].streamUrl = streamUrl;
          items[items.length - 1].startTime = EPOCH + totalDuration * 1000;
          totalDuration += duration;
          console.log(items[items.length - 1]);

          // Sleep for 1 second * number of stations
          // await new Promise((resolve) =>
          //   setTimeout(resolve, STATIONS.length * 1000)
          // );
        }

        return {
          name: station.name,
          frequency: station.frequency,
          identifier: station.identifier,
          items: items,
        };
      })
    );

    // Create the output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "src", "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get current UTC date in DD-MM-YYYY format
    const date = new Date();
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const dateString = `${day}-${month}-${year}`;

    // Write the data to a JSON file with date in filename
    const outputPath = path.join(outputDir, `${dateString}-radio-data.json`);
    fs.writeFileSync(outputPath, JSON.stringify(radioData, null, 2));

    console.log(`Radio data generated successfully at: ${outputPath}`);
    console.log(`Generated data for ${radioData.length} stations`);
  } catch (error) {
    console.error("Error generating radio data:", error);
    process.exit(1);
  }
}

// Run the script
generateRadioData();

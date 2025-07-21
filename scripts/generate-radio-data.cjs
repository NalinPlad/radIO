const fs = require("fs");
const path = require("path");

// current time
const EPOCH = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();

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
  {
    name: "Crap From The Past",
    frequency: 78.5,
    identifier: "crapfromthepast",
  },
  {
    name: "National Public Radio",
    frequency: 95.1,
    identifier: "nprtopofthehour",
  },
];

const SEARCH_URL = (collection) =>
  `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+mediatype:audio+AND+format:MP3&rows=9999&output=json`;

async function getFileInfo(identifier) {
  const metadata = await fetch(
    "https://archive.org/metadata/" + identifier
  ).then((res) => res.json());

  const file = metadata.files.find((file) => file.format.includes("MP3"));

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

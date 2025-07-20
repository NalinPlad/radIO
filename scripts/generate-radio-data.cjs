const fs = require("fs");
const path = require("path");

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

async function getStreamUrl(identifier) {
  const metadata = await fetch(
    "https://archive.org/metadata/" + identifier
  ).then((res) => res.json());
  const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(
    metadata.files.find((file) => file.format.includes("MP3")).name
  )}`;
  return streamUrl;
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

        const items = response.map((item) => {
          return {
            identifier: item.identifier,
            title: item.title,
          };
        });

        console.log(`Found ${items.length} items for ${station.name}`);

        // Get stream URL for the first item
        const streamUrl = await getStreamUrl(items[0].identifier);

        return {
          name: station.name,
          frequency: station.frequency,
          identifier: station.identifier,
          items: items,
          streamUrl: streamUrl,
        };
      })
    );

    // Create the output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "src", "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the data to a JSON file
    const outputPath = path.join(outputDir, "radio-data.json");
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

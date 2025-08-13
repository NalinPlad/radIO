const fs = require("fs");
const path = require("path");

// current time
const EPOCH = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();

// Static data to build the radio from
const STATION_CONFIGS = [
  {
    name: "BookCentral",
    identifier: "radiobooks",
    category: "Literature",
    shuffle: false,
  },
  {
    name: "Concert Grande WFUV",
    identifier: "concert-grande-radio",
    category: "Music",
    regex: "^((?!interview).)*$",
  },
  {
    name: "Crap From The Past",
    identifier: "crapfromthepast",
    category: "Music",
  },
  {
    name: "NPR Top of the Hour",
    identifier: "nprtopofthehour",
    category: "News",
  },
  {
    name: "NPR All Things Considered",
    identifier: "npr-all-things-considered",
    category: "News",
  },
  {
    name: "BBC World Service",
    identifier: "Radio-BBC-World-Service",
    category: "News",
    regex: "BBC_World_Service_[0-9]{8}_[0-9]{6}$",
  },
  { name: "MixTape Central", identifier: "hiphopmixtapes", category: "Music" },
  { name: "HipHop Radio", identifier: "hiphopradioarchive", category: "Music" },
  {
    name: "VaporWavio",
    identifier: "vapor-vault",
    category: "Music",
    subject_tags: ["soundtrack", "late night lo-fi"],
  },
  { name: "Democracy Now!", identifier: "democracy_now", category: "News" },
  {
    name: "WWII News Radio",
    identifier: "wwIIarchive-audio",
    category: "History",
  },
  {
    name: "Executive Speech",
    identifier: "presidential_recordings",
    category: "History",
  },
  {
    name: "NASA Space Channel",
    identifier: "audiohighlightreels",
    category: "History",
  },
  {
    name: "Hacker Public Radio",
    identifier: "hackerpublicradio",
    category: "STEM",
    regex: "^Hackerpublicradio.org",
    shuffle: false,
  },
  {
    name: "Transatlantic Poetry Show",
    identifier: "transatlantic-poetry",
    category: "Literature",
  },
  {
    name: "Pirate Radio",
    identifier: "pirateradioairchecks",
    category: "Misc",
  },
  { name: "CU-JAZZ central", identifier: "cujazz", category: "Music" },
  { name: "Jazz Legends", identifier: "davidwnivenjazz", category: "Music" },
  {
    name: "Radio Morocco",
    identifier: "morocco_radio_archive",
    category: "Misc",
  },
  {
    name: "Melody Brazil Radio",
    identifier: "melodybrazilradio",
    category: "Music",
  },
  {
    name: "Prank Callz",
    identifier: "prankcallarchive",
    category: "Entertainment",
  },
  {
    name: "Diffusion Science Radio",
    identifier: "diffusionscienceradio",
    category: "STEM",
  },
  {
    name: "Kentucky Sports Radio",
    identifier: "kentucky-sports-radio",
    category: "Sports",
  },
  {
    name: "Gutenberg Audiobook Station",
    identifier: "gutenberg-audiobooks",
    category: "Literature",
    shuffle: false,
  },
  {
    name: "Estación de Hip-Hop",
    identifier: "spanish-speaking-hip-hop",
    category: "Music",
    regex: "mixtape",
  },
  {
    name: "Video Game Radio",
    identifier: "",
    category: "Music",
    subject_tags: ["video game music"],
  },
  {
    name: "Bobby Loves Jazz",
    identifier: "vinyl_robert-haber-records",
    category: "Music",
  },
  {
    name: "DUPA Grassroots Media",
    identifier: "du-participatory-archive",
    category: "Misc",
  },
  {
    name: "American Forces Network",
    identifier: "armedforcesradioservice",
    category: "Entertainment",
  },
  { name: "Radia", identifier: "radiafm", category: "Misc" },
  {
    name: "Independant Cassette Network",
    identifier: "noise-arch",
    category: "Misc",
  },
  { name: "Naropa Poetry", identifier: "naropa", category: "Literature" },
  {
    name: "Scanner Radio Broadcast",
    identifier: "scanner_recordings",
    category: "Misc",
    regex: "(LASD|Hamtramck)",
  },
];

const FREQ_MIN = 55;
const FREQ_MAX = 155;
const N = STATION_CONFIGS.length;
const SPACING = (FREQ_MAX - FREQ_MIN) / (N - 1);

const STATIONS = STATION_CONFIGS.map((cfg, i) => ({
  ...cfg,
  frequency: Math.round((FREQ_MIN + i * SPACING) * 10) / 10,
}));

const SEARCH_URL = (collection, subject_tags) =>
  `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+mediatype:audio+AND+format:MP3${
    subject_tags
      ? subject_tags
          .map(
            (tag, ind) =>
              `+${ind === 0 ? "AND" : "OR"}+subject:${encodeURIComponent(tag)}`
          )
          .join("")
      : ""
  }&rows=9999&output=json`;

const DURATION = (string) => {
  if (string.includes(":")) {
    return string.split(":").reduce((acc, curr, index) => {
      return acc + curr * (index === 0 ? 60 : 1);
    }, 0);
  }
  return Number(string);
};

async function getFileInfo(identifier, shuffle = true) {
  const metadata = await fetch(
    "https://archive.org/metadata/" + identifier
  ).then((res) => res.json());

  // random file from the list
  let mp3s = metadata.files.filter((file) => file.format.includes("MP3"));

  if (shuffle) {
    mp3s = mp3s.sort(() => Math.random() - 0.5);
  }

  let dur = 0;
  let return_files = [];

  // collect up to a 5 hours of files from item
  while (dur < 5 * 60 * 60 && mp3s.length > 0) {
    const file = mp3s.shift();
    dur += DURATION(file.length);

    const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(
      file.name
    )}`;

    return_files.push({
      streamUrl,
      duration: DURATION(file.length),
      filename: file.name,
    });
  }

  return return_files;
}

async function generateRadioData() {
  // console.log("Generating radio data...");

  try {
    // Modes:
    //  - Default: clean TUI with progress bars
    //  - Plain/traditional: --plain | --no-tui | --traditional (no TUI, log important messages only)
    //  - Silent: --silent (no output except errors)
    const SILENT = process.argv.includes("--silent");
    const PLAIN =
      process.argv.includes("--plain") ||
      process.argv.includes("--no-tui") ||
      process.argv.includes("--traditional");
    const USE_TUI = !PLAIN && !SILENT && process.stdout.isTTY;

    const SECONDS_PER_DAY = 24 * 60 * 60;

    // Shared per-station state for TUI rendering
    const stationStates = STATIONS.map((s) => ({
      name: s.name,
      percent: 0,
      status: "pending", // pending | loading | done | error
    }));

    const hideCursor = () => {
      if (USE_TUI) process.stdout.write("\x1b[?25l");
    };
    const showCursor = () => {
      if (USE_TUI) process.stdout.write("\x1b[?25h");
    };
    const clearAndHome = () => {
      if (USE_TUI) process.stdout.write("\x1b[2J\x1b[H");
    };
    const makeBar = (percent, width) => {
      const filled = Math.round((percent / 100) * width);
      return (
        "[" +
        "#".repeat(filled).padEnd(width, " ") +
        "] " +
        String(percent).padStart(3, " ") +
        "%"
      );
    };
    const renderTUI = () => {
      if (!USE_TUI) return;
      const cols = process.stdout.columns || 80;
      const nameCol = 28;
      const barWidth = Math.max(10, Math.min(40, cols - nameCol - 4));
      let out = "radIO data generator\n\n";
      for (const st of stationStates) {
        const name =
          st.name.length > nameCol - 2
            ? st.name.slice(0, nameCol - 5) + "..."
            : st.name;
        const bar = makeBar(st.percent, barWidth);
        out += name.padEnd(nameCol, " ") + bar + "\n";
      }
      clearAndHome();
      process.stdout.write(out);
    };
    const logImportant = (msg) => {
      if (!SILENT && !USE_TUI) console.log(msg);
    };

    hideCursor();
    renderTUI();
    logImportant("Generating radio data...");

    const radioData = await Promise.all(
      STATIONS.map(async (station, stationIdx) => {
        // mark station as loading in TUI
        if (USE_TUI) {
          stationStates[stationIdx].status = "loading";
          stationStates[stationIdx].percent = 0;
          renderTUI();
        }

        // Get list of items in the collection
        // console.log(SEARCH_URL(station.identifier, station.subject_tags));
        const search_url = SEARCH_URL(station.identifier, station.subject_tags);
        const response = await fetch(search_url)
          .then((res) => res.json())
          .then((data) => {
            if (!data || !data.response || !data.response.docs) {
              throw new Error(
                `Archive search failed for ${station.name}: ${search_url}`
              );
            }
            return data.response.docs;
          });

        let collection_items = response
          .sort(() => Math.random() - 0.5)
          .map((item) => {
            return {
              identifier: item.identifier,
              title: item.title,
            };
          });

        if (station.regex) {
          const old_length = collection_items.length;
          collection_items = collection_items.filter((item) =>
            item.identifier.match(station.regex)
          );
          logImportant(
            `Filtered ${old_length} items to ${collection_items.length} items for ${station.name}`
          );
        } else {
          logImportant(
            `Found ${collection_items.length} items for ${station.name}`
          );
        }

        let totalDuration = 0;

        let items = [];

        // For progress updates
        let lastPercent = 0;

        while (totalDuration < 24 * 60 * 60 && collection_items.length > 0) {
          const files = await getFileInfo(
            collection_items[0].identifier,
            station.shuffle
          );

          for (const file of files) {
            if (file.duration === -1) {
              if (!SILENT && !USE_TUI) {
                process.stderr.write(
                  `Skipping file ${collection_items[0].identifier} due to parsing failure\n`
                );
              }
              // collection_items.shift(); // Remove the failed item
              continue;
            }

            // Add item without startTime
            items.push({
              identifier: collection_items[0].identifier,
              title:
                collection_items[0].title +
                " | " +
                file.filename
                  .replace(".mp3", "")
                  .replace("-", " ")
                  .replace("_", " "),
              duration: file.duration,
              streamUrl: file.streamUrl,
            });
            totalDuration += file.duration;
          }
          // progress update
          const percent = Math.min(
            100,
            Math.round((totalDuration / SECONDS_PER_DAY) * 100)
          );
          if (percent !== lastPercent) {
            lastPercent = percent;
            if (USE_TUI) {
              stationStates[stationIdx].percent = percent;
              renderTUI();
            }
          }

          // collection_items.shift();
          // randomize the list

          if (station.shuffle === false) {
            // :)
          } else {
            collection_items = collection_items.sort(() => Math.random() - 0.5);
          }

          // In plain mode we don't spam progress
        }

        // If we run out of content and totalDuration is still less than 24 hours, duplicate the items list
        if (items.length > 0 && totalDuration < 24 * 60 * 60) {
          let originalItems = items.slice();
          while (totalDuration < 24 * 60 * 60) {
            for (const item of originalItems) {
              if (totalDuration >= 24 * 60 * 60) break;
              // Add duplicate without startTime
              items.push({ ...item });
              totalDuration += item.duration;
            }
          }
        }

        // ensure 100% at completion in TUI
        if (USE_TUI) {
          stationStates[stationIdx].percent = 100;
          stationStates[stationIdx].status = "done";
          renderTUI();
        }

        // Randomize the items list
        items = items.sort(() => Math.random() - 0.5);

        // Now generate startTimes sequentially
        let runningTime = 0;
        for (const item of items) {
          item.startTime = EPOCH + runningTime * 1000;
          runningTime += item.duration;
        }

        return {
          name: station.name,
          frequency: station.frequency,
          identifier: station.identifier,
          category: station.category,
          items,
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

    if (USE_TUI) {
      renderTUI();
      showCursor();
    }
    if (!SILENT) {
      console.log(`Radio data generated successfully at: ${outputPath}`);
      console.log(`Generated data for ${radioData.length} stations`);
    }
  } catch (error) {
    // restore cursor if TUI was active
    if (process.stdout.isTTY) {
      process.stdout.write("\x1b[?25h");
    }
    console.error("Error generating radio data:", error);
    process.exit(1);
  }
}

// Run the script
generateRadioData();

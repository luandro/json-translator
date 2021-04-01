const fs = require("fs");
const translate = require("@vitalets/google-translate-api");
const clone = require("clone");
const chalk = require("chalk");

const lang = process.argv.slice(2)[0];
const source = process.argv.slice(2)[1] || "./example.json";
const defaultName = source.split(".json")[0];
const dest = process.argv.slice(2)[2] || `${defaultName}_${lang}.json`;
let tries = 0;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runTranslate(term) {
  try {
    const translation = await translate(term, { to: lang || "pt" });
    return translation.text;
  } catch (err) {
    console.log("ERROR on translation", err);
    await sleep(1000);
    tries++;
    console.log("Tries", tries);
    if (tries < 10) runTranslate();
  }
}

async function readFile() {
  try {
    const data = fs.readFileSync(source, "utf8");

    // parse JSON string to JSON object
    const database = JSON.parse(data);
    let newDatabase = clone(database);
    for await (let group of Object.keys(database)) {
      if (typeof database[group] !== "string") {
        for await (let term of Object.keys(database[group])) {
          const translated = await runTranslate(database[group][term]);
          console.log(
            `Translated ${chalk.red(database[group][term])} to ${chalk.green(
              translated
            )}`
          );
          newDatabase[group][term] = translated;
        }
      }
    }
    await fs.writeFileSync(dest, JSON.stringify(newDatabase));
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`);
  }
}

async function run() {
  console.log(
    chalk.blue(`
__ __       ___                  
|(_ /  \|\ |   | _ _  _  _| _ |_ _ 
__)__)\__/| \|   || (_|| )_)|(_||_(- 
                                   
`)
  );
  console.log("Opening", source);
  await readFile();
  console.log("Saving to", dest);
}

run();

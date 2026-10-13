// Validates registry.json and every public/r/*.json against shadcn's published schemas.
// SCHEMA_SOURCE=remote (CI) fetches them and fails if it cannot; =vendored reads schema/;
// the default, auto, fetches and falls back to schema/ when offline.
import { readdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import Ajv from "ajv"

const root = new URL("..", import.meta.url).pathname
const BASE = "https://ui.shadcn.com/schema"
const NAMES = ["registry.json", "registry-item.json"]
const source = process.env.SCHEMA_SOURCE ?? "auto"

async function load(name) {
  if (source !== "vendored") {
    try {
      const res = await fetch(`${BASE}/${name}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return { schema: await res.json(), from: `${BASE}/${name}` }
    } catch (error) {
      if (source === "remote") throw new Error(`Cannot fetch ${BASE}/${name}: ${error.message}`)
      console.warn(`Cannot fetch ${BASE}/${name} (${error.message}); using the vendored copy.`)
    }
  }
  return { schema: JSON.parse(readFileSync(join(root, "schema", name), "utf8")), from: `schema/${name}` }
}

const ajv = new Ajv({ allErrors: true, strict: false })
// shadcn's schemas name draft-07 by its https URL; Ajv only registers the http one.
const draft07 = createRequire(import.meta.url)("ajv/dist/refs/json-schema-draft-07.json")
ajv.addMetaSchema({ ...draft07, $id: "https://json-schema.org/draft-07/schema" })
const validators = {}
for (const name of NAMES) {
  const { schema, from } = await load(name)
  ajv.addSchema(schema, `${BASE}/${name}`)
  validators[name] = () => ajv.getSchema(`${BASE}/${name}`)
  console.log(`schema ${name} <- ${from}`)
}

const targets = [["registry.json", "registry.json"]]
for (const file of readdirSync(join(root, "public/r")).filter((f) => f.endsWith(".json")).sort()) {
  targets.push([`public/r/${file}`, file === "registry.json" ? "registry.json" : "registry-item.json"])
}

let failed = 0
for (const [path, name] of targets) {
  const validate = validators[name]()
  const data = JSON.parse(readFileSync(join(root, path), "utf8"))
  if (validate(data)) {
    console.log(`ok   ${path} (${name})`)
  } else {
    failed++
    console.error(`FAIL ${path} (${name})`)
    for (const error of validate.errors) console.error(`  ${error.instancePath || "/"} ${error.message}`)
  }
}
if (failed) process.exit(1)

"use client"

/**
 * A product's tags with a create row and an inherited tag, a task's labels
 * in the compact form, and a table cell's line of chips ending in "+N".
 */

import * as React from "react"

import { TagInput, type TagItem, TagList } from "@/components/tag-input"

type DemoTag = TagItem & { color: string }

const COLORS: Record<string, string> = {
  sky: "bg-sky-100 text-sky-800",
  orange: "bg-orange-100 text-orange-800",
  green: "bg-green-100 text-green-800",
  rose: "bg-rose-100 text-rose-800",
}

const ALL: DemoTag[] = [
  { key: "new arrival", name: "New arrival", color: "sky" },
  { key: "sale", name: "Sale", color: "orange" },
  { key: "gift", name: "Gift", color: "green" },
  { key: "fragile", name: "Fragile", color: "rose" },
]

const NAME_RULE = /^[\p{L}\p{Nd} _-]{1,30}$/u

function chipColor(tag: DemoTag) {
  return { className: COLORS[tag.color] }
}

export function TagInputDemo() {
  const [tags, setTags] = React.useState<DemoTag[]>([ALL[1] as DemoTag])
  const [labels, setLabels] = React.useState<DemoTag[]>([])

  const addTo = (set: React.Dispatch<React.SetStateAction<DemoTag[]>>) => (name: string) =>
    set((current) => [
      ...current,
      ALL.find((tag) => tag.name.toLowerCase() === name.toLowerCase()) ?? {
        key: name.toLowerCase(),
        name,
        color: "",
      },
    ])
  const removeFrom = (set: React.Dispatch<React.SetStateAction<DemoTag[]>>) => (key: string) =>
    set((current) => current.filter((tag) => tag.key !== key))

  return (
    <div className="flex max-w-md flex-col gap-6">
      <TagInput
        value={tags}
        inherited={[ALL[0] as DemoTag]}
        options={ALL}
        onAdd={addTo(setTags)}
        onRemove={removeFrom(setTags)}
        isValidName={(name) => NAME_RULE.test(name.trim())}
        entryPosition="start"
        chipProps={chipColor}
        labels={{
          add: "Add a tag",
          button: "Tag",
          suggestions: "Tags",
          remove: (name) => `Remove ${name}`,
          invalid: "Letters, digits, spaces, - and _ only, up to 30.",
          inheritedPrefix: "From the product:",
          create: (name) => `Create “${name}”`,
        }}
      />
      <TagInput
        compact
        value={labels}
        options={ALL}
        onAdd={addTo(setLabels)}
        onRemove={removeFrom(setLabels)}
        isValidName={(name) => NAME_RULE.test(name.trim())}
        removeLastOnBackspace
        optionChipSize="sm"
        chipProps={chipColor}
        labels={{
          add: "Add a label",
          button: "Label",
          suggestions: "Labels",
          remove: (name) => `Remove ${name}`,
          invalid: "Letters, digits, spaces, - and _ only, up to 30.",
        }}
      />
      <TagList
        tags={ALL}
        max={3}
        size="sm"
        chipProps={chipColor}
        overflowLabel={(hidden) => `${hidden.length} more`}
      />
    </div>
  )
}

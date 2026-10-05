import { z } from "zod";

// The bot definition: one JSON document per bot version (docs/PLAN.md §5.3).
// Templates, easy mode, the flow editor, custom code and the AI builder all read and write this shape.
// Plan and limits live on the account in the database, not here, so a definition can be copied between bots.

export const DEFINITION_VERSION = 1;

const id = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/, "ids are lowercase letters, digits and _");
const languageCode = z.string().regex(/^[a-z]{2}$/, "two-letter language code, e.g. uz, ru, en");

/** A text in every language the bot supports: { uz: "...", ru: "...", en: "..." }. */
export const localizedText = z.record(languageCode, z.string());
export type LocalizedText = z.infer<typeof localizedText>;

export const FIELD_TYPES = ["text", "long_text", "number", "boolean", "date", "file", "select", "relation"] as const;

export const fieldSchema = z.object({
  id,
  name: localizedText,
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  /** Field holds one value per language (e.g. a title's name in uz/ru/en). */
  localized: z.boolean().default(false),
  /** For "select": allowed option ids. */
  options: z.array(id).optional(),
  /** For "relation": id of the target table. */
  relationTable: id.optional(),
  /** For "relation": one or many linked rows. */
  many: z.boolean().optional(),
});
export type FieldDefinition = z.infer<typeof fieldSchema>;

export const tableSchema = z.object({
  id,
  name: localizedText,
  fields: z.array(fieldSchema),
});
export type TableDefinition = z.infer<typeof tableSchema>;

export const triggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("command"), command: z.string().regex(/^[a-z0-9_]{1,32}$/) }),
  z.object({ type: z.literal("text"), match: z.string().min(1) }),
  z.object({ type: z.literal("callback"), data: z.string().min(1).max(64) }),
  z.object({ type: z.literal("any_message") }),
]);
export type Trigger = z.infer<typeof triggerSchema>;

export const blockSchema = z.object({
  id,
  /** Block type, e.g. "send_message", "check_channel_join", or a generated Bot API method block "api.sendPoll". */
  type: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
  /** Canvas position, only used by the flow editor. */
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type BlockDefinition = z.infer<typeof blockSchema>;

export const edgeSchema = z.object({
  from: id,
  to: id,
  /** Which output of the source block, e.g. "next", "yes", "no", or a button id. */
  output: z.string().default("next"),
});
export type EdgeDefinition = z.infer<typeof edgeSchema>;

export const flowSchema = z.object({
  id,
  name: z.string().min(1),
  trigger: triggerSchema,
  /** Minimum role allowed to run this flow. "end_user" means anyone. */
  access: z.enum(["end_user", "moderator", "admin", "owner"]).default("end_user"),
  entry: id,
  blocks: z.array(blockSchema).min(1),
  edges: z.array(edgeSchema).default([]),
});
export type FlowDefinition = z.infer<typeof flowSchema>;

export const botDefinitionSchema = z
  .object({
    version: z.literal(DEFINITION_VERSION),
    /** Template this bot was created from, if any. */
    template: id.optional(),
    languages: z.object({
      default: languageCode,
      supported: z.array(languageCode).min(1),
    }),
    texts: z.record(id, localizedText).default({}),
    tables: z.array(tableSchema).default([]),
    flows: z.array(flowSchema).default([]),
    settings: z
      .object({
        /** Channels users must join before using the bot. */
        requiredChannels: z.array(z.string()).default([]),
      })
      .default({ requiredChannels: [] }),
  })
  .superRefine((def, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    if (!def.languages.supported.includes(def.languages.default)) {
      issue(["languages", "default"], "default language must be in supported languages");
    }

    const tableIds = new Set<string>();
    def.tables.forEach((table, ti) => {
      if (tableIds.has(table.id)) issue(["tables", ti, "id"], `duplicate table id "${table.id}"`);
      tableIds.add(table.id);
    });
    def.tables.forEach((table, ti) => {
      const fieldIds = new Set<string>();
      table.fields.forEach((field, fi) => {
        const path = ["tables", ti, "fields", fi];
        if (fieldIds.has(field.id)) issue([...path, "id"], `duplicate field id "${field.id}"`);
        fieldIds.add(field.id);
        if (field.type === "relation" && (!field.relationTable || !tableIds.has(field.relationTable))) {
          issue([...path, "relationTable"], "relation must point to an existing table");
        }
        if (field.type === "select" && !field.options?.length) {
          issue([...path, "options"], "select field needs at least one option");
        }
      });
    });

    const flowIds = new Set<string>();
    def.flows.forEach((flow, fi) => {
      if (flowIds.has(flow.id)) issue(["flows", fi, "id"], `duplicate flow id "${flow.id}"`);
      flowIds.add(flow.id);

      const blockIds = new Set<string>();
      flow.blocks.forEach((block, bi) => {
        if (blockIds.has(block.id)) issue(["flows", fi, "blocks", bi, "id"], `duplicate block id "${block.id}"`);
        blockIds.add(block.id);
      });
      if (!blockIds.has(flow.entry)) issue(["flows", fi, "entry"], "entry must be a block in this flow");
      flow.edges.forEach((edge, ei) => {
        if (!blockIds.has(edge.from)) issue(["flows", fi, "edges", ei, "from"], `unknown block "${edge.from}"`);
        if (!blockIds.has(edge.to)) issue(["flows", fi, "edges", ei, "to"], `unknown block "${edge.to}"`);
      });
    });
  });

export type BotDefinition = z.infer<typeof botDefinitionSchema>;

export function parseBotDefinition(input: unknown): BotDefinition {
  return botDefinitionSchema.parse(input);
}

/** Smallest valid definition: a /start command that greets the user. */
export function emptyBotDefinition(languages: string[] = ["uz", "ru", "en"]): BotDefinition {
  const [first = "uz"] = languages;
  return parseBotDefinition({
    version: DEFINITION_VERSION,
    languages: { default: first, supported: languages },
    texts: { welcome: Object.fromEntries(languages.map((lang) => [lang, ""])) },
    flows: [
      {
        id: "start",
        name: "Start",
        trigger: { type: "command", command: "start" },
        entry: "welcome",
        blocks: [{ id: "welcome", type: "send_message", params: { text: "welcome" } }],
      },
    ],
  });
}

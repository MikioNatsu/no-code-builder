import { describe, expect, it } from "vitest";
import { botDefinitionSchema, emptyBotDefinition, parseBotDefinition } from "./definition.js";

const base = () => structuredClone(emptyBotDefinition()) as Record<string, any>;

const errors = (input: unknown) => {
  const result = botDefinitionSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("bot definition", () => {
  it("builds a valid empty definition", () => {
    const def = emptyBotDefinition();
    expect(def.languages).toEqual({ default: "uz", supported: ["uz", "ru", "en"] });
    expect(def.flows[0]?.trigger).toEqual({ type: "command", command: "start" });
    expect(def.settings.requiredChannels).toEqual([]);
  });

  it("round-trips through JSON", () => {
    const def = emptyBotDefinition(["ru", "en"]);
    expect(parseBotDefinition(JSON.parse(JSON.stringify(def)))).toEqual(def);
  });

  it("requires the default language to be supported", () => {
    const def = base();
    def.languages.default = "de";
    expect(errors(def)).toContain("default language must be in supported languages");
  });

  it("checks relations point to existing tables", () => {
    const def = base();
    def.tables = [
      { id: "titles", name: { uz: "Nomlar" }, fields: [{ id: "name", name: { uz: "Nomi" }, type: "text" }] },
      {
        id: "episodes",
        name: { uz: "Qismlar" },
        fields: [
          { id: "title", name: { uz: "Nom" }, type: "relation", relationTable: "titles" },
          { id: "season", name: { uz: "Mavsum" }, type: "relation", relationTable: "seasons" },
        ],
      },
    ];
    expect(errors(def)).toEqual(["relation must point to an existing table"]);
  });

  it("checks flow entry and edges reference blocks", () => {
    const def = base();
    def.flows[0].entry = "missing";
    def.flows[0].edges = [{ from: "welcome", to: "nowhere" }];
    expect(errors(def)).toEqual(["entry must be a block in this flow", 'unknown block "nowhere"']);
  });

  it("rejects duplicate ids", () => {
    const def = base();
    def.flows.push(structuredClone(def.flows[0]));
    expect(errors(def)).toContain('duplicate flow id "start"');
  });

  it("rejects invalid ids", () => {
    const def = base();
    def.flows[0].id = "Start Flow";
    expect(errors(def).length).toBeGreaterThan(0);
  });
});

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Ingredient, IngredientDocument } from "../../database/schemas/ingredient.schema";

// Canonical alias dictionary for culinary staples
const ALIAS_DICTIONARY: Record<string, string[]> = {
  coriander: ["cilantro", "fresh coriander", "dhaniya", "coriander leaves", "kothmir"],
  capsicum: ["bell pepper", "green pepper", "red bell pepper", "sweet pepper", "shimla mirch"],
  curd: ["yogurt", "dahi", "plain yogurt", "greek yogurt"],
  maida: ["all-purpose flour", "all purpose flour", "plain flour", "white flour"],
  paneer: ["cottage cheese", "indian cottage cheese", "chenna"],
  "spring onion": ["scallion", "scallions", "green onion", "green onions"],
  ginger: ["adrak", "fresh ginger", "ginger root"],
  garlic: ["lehsun", "garlic cloves", "garlic bulb"],
  cumin: ["jeera", "cumin seeds", "jeera seeds"],
  turmeric: ["haldi", "turmeric powder"],
  "chili powder": ["chilli powder", "red chili powder", "red chilli powder", "lal mirch"],
  "garam masala": ["all spice mix", "curry powder"],
  tomato: ["tomatoes", "tamatar", "roma tomato", "plum tomato"],
  onion: ["onions", "pyaaz", "red onion", "yellow onion"],
  potato: ["potatoes", "aloo", "russet potato", "baby potato"],
  chicken: ["chicken breast", "chicken thighs", "boneless chicken", "murgh"],
  fish: ["salmon", "cod", "pomfret", "surmai", "fish fillets", "sea bass"],
  rice: ["basmati rice", "white rice", "brown rice", "chawal", "jasmine rice"],
  butter: ["makhan", "unsalted butter", "salted butter"],
  ghee: ["clarified butter", "desi ghee"],
  cream: ["heavy cream", "fresh cream", "malai", "whipping cream"],
  "coconut milk": ["nariyal doodh", "coconut cream"],
  pasta: ["spaghetti", "penne", "fettuccine", "rigatoni", "macaroni"],
  chilli: ["chili", "green chili", "green chilli", "red chili", "red chilli", "hari mirch"],
  egg: ["eggs", "anda", "egg white", "egg yolk"],
  lemon: ["lime", "nimbu", "lemon juice", "lime juice"],
  "gram flour": ["besan", "chickpea flour", "garbanzo flour"],
  lentils: ["dal", "daal", "dhal", "lentil", "toor dal", "moong dal", "masoor dal", "urad dal", "chana dal"],
  mint: ["pudina", "mint leaves", "fresh mint"],
  fenugreek: ["methi", "kasuri methi", "fenugreek leaves"],
  "ginger garlic paste": ["ginger-garlic paste", "adrak lehsun paste"],
};

// Inverted lookup map for O(1) canonical resolution
const INVERTED_ALIAS_MAP: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(ALIAS_DICTIONARY)) {
  INVERTED_ALIAS_MAP[canonical.toLowerCase()] = canonical.toLowerCase();
  for (const alias of aliases) {
    INVERTED_ALIAS_MAP[alias.toLowerCase()] = canonical.toLowerCase();
  }
}

@Injectable()
export class IngredientsService {
  constructor(
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>
  ) {}

  async search(query: string, limit = 20) {
    if (!query || !query.trim()) {
      return this.ingredientModel.find().limit(limit).lean();
    }
    const clean = query.trim().toLowerCase();
    const canonical = this.resolveCanonical(clean);

    return this.ingredientModel
      .find({
        $or: [
          { name: { $regex: clean, $options: "i" } },
          { normalizedName: { $regex: clean, $options: "i" } },
          { aliases: { $in: [new RegExp(clean, "i"), new RegExp(canonical, "i")] } },
        ],
      })
      .limit(limit)
      .lean();
  }

  normalizeIngredientName(raw: string): string {
    if (!raw) return "";
    const clean = raw
      .toLowerCase()
      .replace(/[0-9]+(\.[0-9]+)?(\s*(g|kg|ml|l|cup|cups|tbsp|tsp|piece|pieces|slice|slices|pinch|can|cans|clove|cloves))?/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/fresh|ripe|boneless|skinless|diced|chopped|sliced|minced|grated|peeled|toasted|roasted|crushed|powdered/g, "")
      .trim();

    return this.resolveCanonical(clean);
  }

  resolveCanonical(term: string): string {
    const lower = term.toLowerCase().trim();
    if (INVERTED_ALIAS_MAP[lower]) {
      return INVERTED_ALIAS_MAP[lower];
    }

    // Check if any alias substring matches
    for (const [alias, canonical] of Object.entries(INVERTED_ALIAS_MAP)) {
      if (lower.includes(alias) || alias.includes(lower)) {
        return canonical;
      }
    }

    return lower;
  }

  areIngredientsMatching(ingredientA: string, ingredientB: string): boolean {
    const normA = this.normalizeIngredientName(ingredientA);
    const normB = this.normalizeIngredientName(ingredientB);

    if (normA === normB) return true;

    const canonicalA = this.resolveCanonical(normA);
    const canonicalB = this.resolveCanonical(normB);

    if (canonicalA === canonicalB) return true;

    // Direct token intersection
    if (normA.length > 2 && normB.length > 2) {
      if (normA.includes(normB) || normB.includes(normA)) return true;
    }

    return false;
  }
}

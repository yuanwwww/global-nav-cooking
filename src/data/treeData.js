/** Single wrapper row for L3 links that belong directly under an L1 (no visible L2 column). */
export const FLAT_L2_LABEL = "__flat__";

/** Option B — hierarchy aligned with cooking.nytimes.com global nav (L1 / L2 column headers / L3 links) */
export const NAV_TREE = [
  {
    label: "What to Cook",
    l2s: [
      {
        label: "Staff picks",
        l3s: [
          "Most Popular",
          "Soups and Stews",
          "Easy Side Dishes",
          "Healthy Weeknight Dinners",
          "Sheet-Pan Vegetarian Recipes",
        ],
      },
      {
        label: "From our newsletters",
        l3s: ["The Cooking Newsletter", "Five Weeknight Dishes", "The Veggie"],
      },
      {
        label: "Perfect for",
        l3s: [
          "One-Pot Dinners",
          "Weeknight Chicken",
          "Quick Pastas",
          "30 Minute Vegetarian",
          "Easy Baking",
        ],
      },
    ],
  },
  {
    label: "Recipes",
    l1TightPadding: true,
    l2s: [
      {
        label: "Everyday recipes",
        l3s: ["Easy", "Healthy", "Weeknight", "Pasta", "Quick"],
      },
      {
        label: "By meal",
        l3s: [
          "Dinner",
          "Breakfast",
          "Lunch",
          "Desserts",
          "Appetizers",
          "Side Dishes",
          "Drinks",
        ],
      },
      {
        label: "By diet",
        l3s: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
      },
      {
        label: "By method",
        l3s: [
          "Air Fryer",
          "Instant Pot",
          "Slow Cooker",
          "BBQ & Grilling",
          "Sheet Pan",
          "Baking",
        ],
      },
    ],
  },
  {
    label: "Ingredients",
    l2s: [
      {
        label: "Meat & seafood",
        l3s: ["Chicken", "Beef", "Pork", "Salmon", "Shrimp"],
      },
      {
        label: "Vegetables & fruits",
        l3s: [
          "Zucchini",
          "Sweet Potato",
          "Eggplant",
          "Cabbage",
          "Asparagus",
          "Tomato",
        ],
      },
      {
        label: "Plant-based proteins",
        l3s: ["Tofu", "Lentil", "Chickpea", "Bean"],
      },
      {
        label: "Rice, grains, pasta",
        l3s: ["Pasta", "Noodles", "Rice", "Quinoa", "Bread", "Couscous"],
      },
    ],
  },
  {
    label: "Occasions",
    l2s: [
      {
        label: "By upcoming holiday",
        l3s: ["Ramadan", "Lent", "St. Patrick's Day", "Eid al-Fitr"],
      },
      {
        label: "By occasion",
        l3s: ["Birthdays", "Brunch", "Date Night", "Parties", "Picnics"],
      },
    ],
  },
  {
    label: "About",
    l2s: [
      {
        label: FLAT_L2_LABEL,
        hideL2Header: true,
        l3s: ["About Us", "The New York Times Food Section"],
      },
    ],
  },
];

/** Landing / selected-frame hierarchy (matches design board + PNG) */
export const NAV_TREE = [
  {
    label: "What to cook",
    l2s: [
      { label: "Staff picks", l3s: ["Editors’ favorites", "New this week"] },
      { label: "Most Popular", l3s: ["Top saved recipes", "Trending searches"] },
      { label: "Soups and Stews", l3s: ["Chicken noodle", "Vegetarian chili"] },
      {
        label: "newsletters",
        l3s: ["The Morning newsletter", "Cooking digest"],
      },
    ],
  },
  {
    label: "Recipes",
    withDrag: true,
    l2s: [
      {
        label: "By course",
        l3s: ["Appetizers", "Mains", "Desserts"],
      },
      { label: "By diet", l3s: ["Vegetarian", "Vegan"] },
    ],
  },
  {
    label: "Ingredients",
    l2s: [
      { label: "Proteins", l3s: ["Chicken", "Beef"] },
      { label: "Produce", l3s: ["Tomatoes", "Leafy greens"] },
    ],
  },
  {
    label: "Occasions",
    l2s: [
      { label: "Holidays", l3s: ["Thanksgiving", "Christmas"] },
      { label: "Everyday", l3s: ["Weeknight dinners", "Brunch"] },
    ],
  },
  {
    label: "About",
    l2s: [{ label: "Help", l3s: ["FAQ", "Contact us"] }],
  },
];

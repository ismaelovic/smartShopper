// frontend/src/data/onboardingProducts.ts

export interface ProductVariant {
name: string; // e.g., "Letmælk", "Toastbrød" - this will be the productName
}

export interface ProductCategory {
name: string; // e.g., "Dairy", "Bakery"
llmCategory: string; // The canonical category name for the LLM (still useful for backend)
variants: ProductVariant[];
}

export const onboardingProductCategories: ProductCategory[] = [
  {
    name: 'mælk',
    llmCategory: 'Dairy',
    variants: [
      { name: 'Letmælk'},
      { name: 'Sødmælk'},
      { name: 'Minimælk'}
    ]
},
{
  name: 'Ost',
  llmCategory: 'Cheeses',
  variants: [
    { name: 'Klovborg Ost'},
    { name: 'Havarti ost'},
    { name: 'Mozarella'},
    { name: 'Æg'},
    { name: 'Smør'},
    { name: 'Ost'},
  ],
},
{
  name: 'Bread & Bakery',
  llmCategory: 'Bakery',
  variants: [
    { name: 'Rugbrød'},
    { name: 'Franskbrød'},
    { name: 'Fuldkornsbrød'},
    { name: 'Toastbrød'},
    { name: 'Boller'},
  ],
},
{
  name: 'Yoghurt',
  llmCategory: 'Yoghurt',
  variants: [
    { name: 'Cheesy Yoghurt Jordbær'},
    { name: 'Cheesy Yoghurt Pære & Banan' },
    { name: 'Cheesy Yoghurt Skovbær' },
    { name: 'Cheesy Yoghurt Appelsin'},
  ],
},
{
  name: 'Kød & Kylling',
  llmCategory: 'Meat',
  variants: [
    { name: 'Kyllingefilet'},
    { name: 'Oksekød'},
    { name: 'Bacon'},
    { name: 'Spareribs'},
    { name: 'Pølser'},
  ],
},
{
  name: 'Frugt',
  llmCategory: 'Fruits',
  variants: [
    { name: 'Æbler'},
    { name: 'Bananer'},
    { name: 'Appelsiner'},
    { name: 'Pærer'},
    { name: 'Vindruer'},
  ],
},
// Add more categories and products as needed
];
/** @type {import('prettier').Config} */
export default {
  quoteProps: "consistent",
  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  importOrder: [
    "^(react|react-dom)(/.*)?$",
    "^(solid-js|@solidjs)(/.*)?$",
    "<THIRD_PARTY_MODULES>",
    "^~/(.*)$",
    "^[./](?!.*\\.\\w+$)",
    "^[./].*\\.\\w+$",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

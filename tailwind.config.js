// tailwind.config.js

const round = (num) =>
  num
    .toFixed(7)
    .replace(/(\.[0-9]+?)0+$/, "$1")
    .replace(/\.0$/, "");
const rem = (px) => `${round(px / 16)}rem`;
const em = (px, base) => `${round(px / base)}em`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./frontend/index.html", "./frontend/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      typography: {
        // This is a copy of the sm modifier with adjusted margins
        markdown: {
          css: [
            {
              fontSize: rem(14),
              lineHeight: round(20 / 14),
              p: {
                marginTop: em(5, 14),
                marginBottom: em(5, 14),
              },
              '[class~="lead"]': {
                fontSize: em(18, 14),
                lineHeight: round(28 / 18),
                marginTop: em(16, 18),
                marginBottom: em(16, 18),
              },
              blockquote: {
                marginTop: em(24, 18),
                marginBottom: em(24, 18),
                paddingInlineStart: em(20, 18),
              },
              h1: {
                fontSize: em(30, 14),
                marginTop: "0",
                marginBottom: em(24, 30),
                lineHeight: round(36 / 30),
              },
              h2: {
                fontSize: em(20, 14),
                marginTop: em(32, 20),
                marginBottom: em(16, 20),
                lineHeight: round(28 / 20),
              },
              h3: {
                fontSize: em(18, 14),
                marginTop: em(28, 18),
                marginBottom: em(8, 18),
                lineHeight: round(28 / 18),
              },
              h4: {
                marginTop: em(20, 14),
                marginBottom: em(8, 14),
                lineHeight: round(20 / 14),
              },
              img: {
                marginTop: em(24, 14),
                marginBottom: em(24, 14),
              },
              picture: {
                marginTop: em(24, 14),
                marginBottom: em(24, 14),
              },
              "picture > img": {
                marginTop: "0",
                marginBottom: "0",
              },
              video: {
                marginTop: em(24, 14),
                marginBottom: em(24, 14),
              },
              kbd: {
                fontSize: em(12, 14),
                borderRadius: rem(5),
                paddingTop: em(2, 14),
                paddingInlineEnd: em(5, 14),
                paddingBottom: em(2, 14),
                paddingInlineStart: em(5, 14),
              },
              code: {
                fontSize: em(12, 14),
              },
              "h2 code": {
                fontSize: em(18, 20),
              },
              "h3 code": {
                fontSize: em(16, 18),
              },
              pre: {
                fontSize: em(12, 14),
                lineHeight: round(20 / 12),
                marginTop: em(20, 12),
                marginBottom: em(20, 12),
                borderRadius: rem(4),
                paddingTop: em(8, 12),
                paddingInlineEnd: em(12, 12),
                paddingBottom: em(8, 12),
                paddingInlineStart: em(12, 12),
              },
              ol: {
                marginTop: em(7, 14),
                marginBottom: em(7, 14),
                paddingInlineStart: em(22, 14),
              },
              ul: {
                marginTop: em(5, 14),
                marginBottom: em(5, 14),
                paddingInlineStart: em(14, 14),
              },
              li: {
                marginTop: em(0, 14),
                marginBottom: em(0, 14),
              },
              "ul > li": {
                // paddingInlineStart: em(4, 14),
              },
              "> ul > li p": {
                marginTop: em(8, 14),
                marginBottom: em(8, 14),
              },
              "> ul > li > p:first-child": {
                marginTop: em(16, 14),
              },
              "> ul > li > p:last-child": {
                marginBottom: em(16, 14),
              },
              "> ol > li > p:first-child": {
                marginTop: em(16, 14),
              },
              "> ol > li > p:last-child": {
                marginBottom: em(16, 14),
              },
              "ul ul, ul ol, ol ul, ol ol": {
                marginTop: em(0, 14),
                marginBottom: em(0, 14),
              },
              dl: {
                marginTop: em(16, 14),
                marginBottom: em(16, 14),
              },
              dt: {
                marginTop: em(16, 14),
              },
              dd: {
                marginTop: em(4, 14),
                paddingInlineStart: em(22, 14),
              },
              hr: {
                marginTop: em(40, 14),
                marginBottom: em(40, 14),
              },
              "hr + *": {
                marginTop: "0",
              },
              "h2 + *": {
                marginTop: "0",
              },
              "h3 + *": {
                marginTop: "0",
              },
              "h4 + *": {
                marginTop: "0",
              },
              table: {
                fontSize: em(12, 14),
                lineHeight: round(18 / 12),
              },
              "thead th": {
                paddingInlineEnd: em(12, 12),
                paddingBottom: em(8, 12),
                paddingInlineStart: em(12, 12),
              },
              "thead th:first-child": {
                paddingInlineStart: "0",
              },
              "thead th:last-child": {
                paddingInlineEnd: "0",
              },
              "tbody td, tfoot td": {
                paddingTop: em(8, 12),
                paddingInlineEnd: em(12, 12),
                paddingBottom: em(8, 12),
                paddingInlineStart: em(12, 12),
              },
              "tbody td:first-child, tfoot td:first-child": {
                paddingInlineStart: "0",
              },
              "tbody td:last-child, tfoot td:last-child": {
                paddingInlineEnd: "0",
              },
              figure: {
                marginTop: em(24, 14),
                marginBottom: em(24, 14),
              },
              "figure > *": {
                marginTop: "0",
                marginBottom: "0",
              },
              figcaption: {
                fontSize: em(12, 14),
                lineHeight: round(16 / 12),
                marginTop: em(8, 12),
              },
            },
            {
              "> :first-child": {
                marginTop: "0",
              },
              "> :last-child": {
                marginBottom: "0",
              },
            },
          ],
        },
      },
    },
  },
  plugins: [],
};

import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: __WORD_PAGES_TITLE__,
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: __WORD_PAGES_BASE_URL__,
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans 3",
        code: "IBM Plex Mono"
      },
      colors: {
        lightMode: {
          light: "#faf8f3",
          lightgray: "#e5e0d5",
          gray: "#8a8376",
          darkgray: "#3e3a33",
          dark: "#171613",
          secondary: "#28786f",
          tertiary: "#8d5c2c",
          highlight: "rgba(40, 120, 111, 0.14)",
          textHighlight: "#fff0a8"
        },
        darkMode: {
          light: "#181816",
          lightgray: "#2a2a26",
          gray: "#aaa394",
          darkgray: "#ddd8cb",
          dark: "#f8f3e7",
          secondary: "#73c6b6",
          tertiary: "#d39b63",
          highlight: "rgba(115, 198, 182, 0.16)",
          textHighlight: "#5e4d18"
        }
      }
    }
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "filesystem"] }),
      Plugin.SyntaxHighlighting(),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" })
    ],
    filters: [
      Plugin.ExplicitPublish()
    ],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true
      }),
      Plugin.Assets(),
      Plugin.Static()
    ]
  }
}

export default config

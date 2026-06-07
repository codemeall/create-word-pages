export const defaultThemePreset = "clean-garden"

export const themePresets = {
  "clean-garden": {
    name: "Paper",
    description: "Warm paper pages with calm green links and soft reading contrast.",
    swatches: ["#faf8f3", "#28786f", "#8d5c2c"],
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
  },
  "library-blue": {
    name: "Minimal",
    description: "Clean white pages with a precise blue accent for docs and portfolios.",
    swatches: ["#fbfcff", "#2f62b3", "#7c5f2b"],
    colors: {
      lightMode: {
        light: "#fbfcff",
        lightgray: "#dde5f2",
        gray: "#738095",
        darkgray: "#354056",
        dark: "#111827",
        secondary: "#2f62b3",
        tertiary: "#7c5f2b",
        highlight: "rgba(47, 98, 179, 0.13)",
        textHighlight: "#fff2a8"
      },
      darkMode: {
        light: "#111827",
        lightgray: "#263244",
        gray: "#a8b3c7",
        darkgray: "#dce6f7",
        dark: "#f8fbff",
        secondary: "#8ab4ff",
        tertiary: "#d9b36f",
        highlight: "rgba(138, 180, 255, 0.16)",
        textHighlight: "#534515"
      }
    }
  },
  "ink-rose": {
    name: "Editorial",
    description: "Magazine-style pages with ink, rose, and copper accents.",
    swatches: ["#fffafa", "#b43f62", "#9a6129"],
    colors: {
      lightMode: {
        light: "#fffafa",
        lightgray: "#eadde2",
        gray: "#8c7880",
        darkgray: "#45343b",
        dark: "#1b1115",
        secondary: "#b43f62",
        tertiary: "#9a6129",
        highlight: "rgba(180, 63, 98, 0.13)",
        textHighlight: "#fff0a8"
      },
      darkMode: {
        light: "#1b1115",
        lightgray: "#312128",
        gray: "#bda6ae",
        darkgray: "#ead8de",
        dark: "#fff8fa",
        secondary: "#f08aaa",
        tertiary: "#e1a66e",
        highlight: "rgba(240, 138, 170, 0.17)",
        textHighlight: "#5f3b15"
      }
    }
  },
  "forest-mint": {
    name: "Notebook",
    description: "Obsidian-friendly notebook tones with forest and mint accents.",
    swatches: ["#f7fbf6", "#24745d", "#596f2d"],
    colors: {
      lightMode: {
        light: "#f7fbf6",
        lightgray: "#dbe8d8",
        gray: "#758472",
        darkgray: "#344335",
        dark: "#121a13",
        secondary: "#24745d",
        tertiary: "#596f2d",
        highlight: "rgba(36, 116, 93, 0.14)",
        textHighlight: "#f7f3a0"
      },
      darkMode: {
        light: "#111a15",
        lightgray: "#243229",
        gray: "#a8b7a3",
        darkgray: "#dcead8",
        dark: "#f7fff5",
        secondary: "#78d6b7",
        tertiary: "#b6cf75",
        highlight: "rgba(120, 214, 183, 0.17)",
        textHighlight: "#4d5319"
      }
    }
  }
}

export const themePresetIds = Object.keys(themePresets)

export function getThemePreset(preset) {
  return themePresets[preset] ?? themePresets[defaultThemePreset]
}

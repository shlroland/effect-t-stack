import gradient from "gradient-string"

/**
 * Block ASCII for "EFFECT" / "T STACK" — same style as Better-T-Stack's banner.
 */
const TITLE_TEXT = `
 ███████╗ ███████╗ ███████╗ ███████╗  ██████╗ ████████╗
 ██╔════╝ ██╔════╝ ██╔════╝ ██╔════╝ ██╔════╝ ╚══██╔══╝
 █████╗   █████╗   █████╗   █████╗   ██║         ██║
 ██╔══╝   ██╔══╝   ██╔══╝   ██╔══╝   ██║         ██║
 ███████╗ ██║      ██║      ███████╗ ╚██████╗    ██║
 ╚══════╝ ╚═╝      ╚═╝      ╚══════╝  ╚═════╝    ╚═╝

 ████████╗    ███████╗ ████████╗  █████╗   ██████╗ ██╗  ██╗
 ╚══██╔══╝    ██╔════╝ ╚══██╔══╝ ██╔══██╗ ██╔════╝ ██║ ██╔╝
    ██║       ███████╗    ██║    ███████║ ██║      █████╔╝
    ██║       ╚════██║    ██║    ██╔══██║ ██║      ██╔═██╗
    ██║       ███████║    ██║    ██║  ██║ ╚██████╗ ██║  ██╗
    ╚═╝       ╚══════╝    ╚═╝    ╚═╝  ╚═╝  ╚═════╝ ╚═╝  ╚═╝
`

/** Catppuccin-inspired palette (same family BTS uses). */
const theme = {
  pink: "#F5C2E7",
  mauve: "#CBA6F7",
  red: "#F38BA8",
  maroon: "#E78284",
  peach: "#FAB387",
  yellow: "#F9E2AF",
  green: "#A6E3A1",
  teal: "#94E2D5",
  sky: "#89DCEB",
  sapphire: "#74C7EC",
  lavender: "#B4BEFE"
} as const

const FALLBACK_TEXT = "create-effect-t-stack"

const colorize = (text: string): string => {
  const paint = gradient(Object.values(theme))
  return paint.multiline(text)
}

const wantsColor = (): boolean => {
  if (process.env["NO_COLOR"] !== undefined) return false
  if (process.env["FORCE_COLOR"] === "0") return false
  if (process.env["FORCE_COLOR"] !== undefined && process.env["FORCE_COLOR"] !== "") return true
  return process.stdout.isTTY === true
}

/** Render the create banner (plain ASCII when not a color TTY). */
export const renderTitleText = (): string => {
  const terminalWidth = process.stdout.columns || 80
  const titleLines = TITLE_TEXT.split("\n")
  const maxLine = Math.max(...titleLines.map((line) => line.length))
  const body = terminalWidth < maxLine ? FALLBACK_TEXT : TITLE_TEXT.trimEnd()
  return wantsColor() ? colorize(body) : body
}

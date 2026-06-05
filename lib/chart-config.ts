export const CHART_COLORS = {
  axis: "rgba(34, 40, 57, 0.7)",
  balance: "#4ca6a8",
  card: "#cf66ff",
  expense: "#ff7654",
  grid: "rgba(34, 40, 57, 0.08)",
  income: "#3c5d12",
  labelBg: "rgba(255, 255, 255, 0.9)",
  labelText: "#222839",
  palette: ["#8b6df2", "#ff8384", "#47bad0", "#ffad61", "#4e7ff0", "#3c5d12", "#d07458", "#7d8799"]
} as const;

export const CHART_LAYOUT = {
  bar: {
    height: 300,
    paddingBottom: 42,
    paddingLeft: 68,
    paddingRight: 20,
    paddingTop: 24
  },
  line: {
    height: 258,
    paddingBottom: 40,
    paddingLeft: 56,
    paddingRight: 20,
    paddingTop: 20
  },
  pie: {
    height: 300,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12
  }
} as const;

export const CHART_TEXT = {
  axis: "rgba(34, 40, 57, 0.66)",
  label: "rgba(34, 40, 57, 0.82)",
  muted: "rgba(34, 40, 57, 0.54)"
} as const;

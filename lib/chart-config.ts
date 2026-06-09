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
    height: 360,
    paddingBottom: 50,
    paddingLeft: 72,
    paddingRight: 20,
    paddingTop: 28
  },
  line: {
    height: 320,
    paddingBottom: 50,
    paddingLeft: 62,
    paddingRight: 20,
    paddingTop: 26
  },
  pie: {
    height: 340,
    width: 380,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12
  }
} as const;

export const CHART_TEXT = {
  axis: "rgba(34, 40, 57, 0.72)",
  label: "rgba(34, 40, 57, 0.86)",
  muted: "rgba(34, 40, 57, 0.58)"
} as const;

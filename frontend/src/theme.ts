import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#6366f1" },
    secondary: { main: "#ec4899" },
    success: { main: "#10b981" },
    background: { default: "#f4f5fb", paper: "#ffffff" },
    text: { primary: "#1d2033", secondary: "#6b7280" },
    divider: "rgba(29,32,51,0.08)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 800, letterSpacing: -0.5 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "transform .18s ease, box-shadow .18s ease",
          "&:hover": { transform: "translateY(-3px)", boxShadow: "0 14px 30px rgba(29,32,51,0.10)" },
        },
      },
    },
  },
});

export const tileGradients = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#0ea5e9,#22d3ee)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
  "linear-gradient(135deg,#10b981,#34d399)",
];

export const brandGradient = "linear-gradient(135deg,#6366f1,#8b5cf6)";

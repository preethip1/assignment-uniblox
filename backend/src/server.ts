import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

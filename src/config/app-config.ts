import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Hackathon 4o4",
  version: packageJson.version,
  copyright: `© ${currentYear}, 4o4.`,
  meta: {
    title: "Hackathon 4o4",
    description:
      "Sistema Hackathon 4o4.",
  },
};

import { Config } from "@remotion/cli/config";

// The shader field and Three.js hero need a GL backend during renders.
Config.setChromiumOpenGlRenderer("angle");

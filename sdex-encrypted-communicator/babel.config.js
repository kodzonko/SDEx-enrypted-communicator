process.env.EXPO_ROUTER_APP_ROOT = "../../src/app";

// eslint-disable-next-line func-names
module.exports = function (api) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      ["@babel/preset-env", { targets: { node: "current" } }],
      "@babel/preset-typescript",
    ],
    env: {
      production: {
        plugins: ["react-native-paper/babel"],
      },
    },
    plugins: ["nativewind/babel", require.resolve("expo-router/babel")],
  };
};

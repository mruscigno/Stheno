const { withAppBuildGradle } = require("expo/config-plugins");

const marker = "// STHENO_WINDOWS_NATIVE_BUILD_PATHS";

module.exports = function withWindowsNativeBuildPaths(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error("STHENO's native path plugin requires a Groovy app build.gradle");
    }

    if (mod.modResults.contents.includes(marker)) {
      return mod;
    }

    const anchor = "    namespace ";
    const index = mod.modResults.contents.indexOf(anchor);
    if (index === -1) {
      throw new Error("Could not locate the Android namespace block");
    }

    const insertion = [
      `    ${marker}`,
      "    if (System.getProperty(\"os.name\").toLowerCase().contains(\"windows\")) {",
      "        externalNativeBuild {",
      "            cmake {",
      "                buildStagingDirectory = file(System.getenv(\"STHENO_CMAKE_STAGING_DIR\") ?: \"C:/stheno-cmake\")",
      "            }",
      "        }",
      "    }",
      "",
    ].join("\n");

    mod.modResults.contents =
      mod.modResults.contents.slice(0, index) +
      insertion +
      mod.modResults.contents.slice(index);

    const buildConfigField =
      '        buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\\\"${findProperty(\'reactNativeReleaseLevel\') ?: \'stable\'}\\\""';
    if (!mod.modResults.contents.includes(buildConfigField)) {
      throw new Error("Could not locate the Android defaultConfig block");
    }

    mod.modResults.contents = mod.modResults.contents.replace(
      buildConfigField,
      `${buildConfigField}\n\n        if (System.getProperty("os.name").toLowerCase().contains("windows")) {\n            externalNativeBuild {\n                cmake {\n                    arguments "-DCMAKE_OBJECT_PATH_MAX=180"\n                }\n            }\n        }`,
    );

    return mod;
  });
};

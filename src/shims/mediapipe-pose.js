// @mediapipe/pose ships a UMD bundle that assigns onto the global object and
// declares no ES exports at all. @tensorflow-models/pose-detection still does
// `import { Pose } from "@mediapipe/pose"` at the top of its ESM build, for the
// BlazePose MediaPipe runtime. Create React App's webpack config let that
// resolve to undefined; Turbopack treats it as a hard error and fails the
// build.
//
// This app only ever creates a MoveNet detector (see views/Yoga/Yoga.js), so
// BlazePose is never reached. next.config.js aliases the package to this file,
// which keeps the ~10MB MediaPipe bundle out of the client entirely.
//
// If BlazePose is ever wanted, drop this alias and load MediaPipe from its CDN
// the way the library documents, rather than importing the npm package.
export class Pose {
  constructor() {
    throw new Error(
      '@mediapipe/pose is stubbed out in this app. Only the MoveNet pose ' +
        'detector is supported. See src/shims/mediapipe-pose.js.'
    );
  }
}

export default { Pose };

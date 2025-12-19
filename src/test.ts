import { decodeBase64, decodeBase64URL } from "./index.js";

const array = new Uint8Array([255, 34, 45, 89, 123, 68,23]);
console.log(decodeBase64(array));
console.log(decodeBase64URL(array));
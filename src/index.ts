/**
 * OpenSignal protocol utilities
 * 
 * Copyright (C) 2025  Christian Braghette
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { toByteArray, fromByteArray } from "base64-js"
import nacl from "tweetnacl";

/**
 * Decodes a Uint8Array into a UTF-8 string.
 *
 * @param array - The input byte array.
 * @returns The UTF-8 encoded string.
 */
export function encodeUTF8(array?: Uint8Array): string {
    return new TextDecoder().decode(array);
}

/**
 * Encodes a UTF-8 string into a Uint8Array.
 *
 * @param string - The input string.
 * @returns The resulting Uint8Array.
 */
export function decodeUTF8(string?: string): Uint8Array {
    return new TextEncoder().encode(string);
}

/**
 * Encodes a Uint8Array into a Base64 string.
 *
 * @param array - The input byte array.
 * @returns The Base64 encoded string.
 */
export function encodeBase64(array?: Uint8Array): string {
    return fromByteArray(array ?? new Uint8Array());
}

/**
 * Decodes a Base64 string into a Uint8Array.
 *
 * @param string - The Base64 string.
 * @returns The decoded Uint8Array.
 */
export function decodeBase64(string?: string): Uint8Array {
    return toByteArray(string ?? "");
}

/**
 * Converts a Uint8Array into a number (little-endian).
 *
 * @param array - The input byte array.
 * @returns The resulting number.
 */
export function numberFromUint8Array(array?: Uint8Array): number {
    let total = 0;
    if (array)
        for (let c = 0; c < array.length; c++)
            total += array[c] << (c * 8);
    return total;
}

/**
 * Converts a number into a Uint8Array of specified length (little-endian).
 *
 * @param number - The number to convert.
 * @param length - The desired output length.
 * @returns A Uint8Array representing the number.
 */
export function numberToUint8Array(number?: number, length?: number): Uint8Array {
    if (!number) return new Uint8Array(length ?? 0).fill(0);
    const arr: number[] = [];
    while (number > 0) {
        arr.push(number & 255);
        number = number >>> 8;
    }
    const out = new Uint8Array(length ?? arr.length);
    out.set(arr);
    return out;
}

/**
 * Compare Uint8Arrays.
 * 
 * @param a - First Uint8Array to compare to.
 * @param b - Arrays to compare to the first one.
 * @returns A boolean value.
 */
export function verifyUint8Array(a?: Uint8Array, ...b: (Uint8Array | undefined)[]): boolean {
    b = b.filter(value => value !== undefined);
    if (!a || b.length === 0) return false;
    return (b as Uint8Array[]).every(b => nacl.verify(a, b));
}

/**
 * Concat Uint8Arrays.
 * 
 * @param arrays - Uint8Array to concat.
 * @returns A Uint8Array
 */
export function concatUint8Array(...arrays: Uint8Array[]) {
    const out = new Uint8Array(arrays.map(value => value.length).reduce((prev, curr) => prev + curr));
    let offset = 0;
    arrays.forEach(array => {
        out.set(array, offset);
        offset += array.length;
    });
    return out;
}
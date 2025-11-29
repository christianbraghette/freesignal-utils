/**
 * FreeSignal Protocol
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
import { verify } from "tweetnacl";

/**
 * Decodes a Uint8Array into a UTF-8 string.
 *
 * @param array - The input byte array.
 * @returns The UTF-8 encoded string.
 */
export function decodeUTF8(array: Uint8Array): string {
    return new TextDecoder().decode(array);
}

/**
 * Encodes a UTF-8 string into a Uint8Array.
 *
 * @param string - The input string.
 * @returns The resulting Uint8Array.
 */
export function encodeUTF8(string: string): Uint8Array {
    return new TextEncoder().encode(string);
}

/**
 * Decodes a Uint8Array into a Base64 string.
 *
 * @param array - The input byte array.
 * @returns The Base64 encoded string.
 */
export function decodeBase64(array: Uint8Array): string {
    return fromByteArray(array);
}

/**
 * Encodes a Base64 string into a Uint8Array.
 *
 * @param string - The Base64 string.
 * @returns The decoded Uint8Array.
 */
export function encodeBase64(string: string): Uint8Array {
    return toByteArray(string);
}

export function decodeJSON<T>(array: Uint8Array): T {
    return JSON.parse(decodeUTF8(array));
}

export function encodeJSON(obj: any): Uint8Array {
    return encodeUTF8(JSON.stringify(obj));
}

export function decodeHex(array: Uint8Array): string {
    return Array.from(array.values()).map(value => value.toString(16).padStart(2, '0')).join('');
}

export function encodeHex(string: string): Uint8Array {
    return new Uint8Array(
        Array.from(string).reduce<string[]>((prev, curr, index) => {
            if (index % 2 === 0)
                prev.push(curr);
            else
                prev[prev.length - 1] += curr;
            return prev;
        }, []).map(value => Number.parseInt(value, 16)));
}

/**
 * Converts a Uint8Array into a number.
 *
 * @param array - The input byte array.
 * @returns The resulting number.
 */
export function numberFromArray(array: Uint8Array, endian: 'big' | 'little' = 'little'): number {
    let total = 0;
    if (array) {
        if (endian === 'big') array = array.reverse();
        for (let c = 0; c < array.length; c++)
            total += array[c] << (c * 8);
    }
    return total;
}

/**
 * Converts a number into a Uint8Array of specified length.
 *
 * @param number - The number to convert.
 * @param length - The desired output length.
 * @returns A Uint8Array representing the number.
 */
export function numberToArray(number: number, length?: number, endian: 'big' | 'little' = 'little'): Uint8Array {
    const arr: number[] = [];
    number = Math.floor(number);
    while (number > 0) {
        arr.push(number & 255);
        number = number >>> 8;
    }
    const out = new Uint8Array(length ?? arr.length);
    out.set(arr);
    return endian === 'little' ? out : out.reverse();
}

/**
 * Compare Uint8Arrays.
 * 
 * @param a - First Uint8Array to compare to.
 * @param b - Array to compare to the first one.
 * @param c - Arrays to compare to the first one.
 * @returns A boolean value.
 */
export function verifyArrays(a: Uint8Array, b: Uint8Array, ...c: Uint8Array[]): boolean {
    const arrays = new Array<Uint8Array>().concat(a, b, ...c).filter(array => array !== undefined && array.length > 0);
    if (arrays.length < 2) return false;
    return arrays.every(b => verify(a, b));
}

/**
 * Concat Uint8Arrays.
 * 
 * @param arrays - Uint8Array to concat.
 * @returns A Uint8Array
 */
export function concatArrays(...arrays: Uint8Array[]) {
    return new Uint8Array(arrays.flatMap(buffer => [...buffer]));
}

enum DataType {
    UKNOWN = -1,
    RAW,
    NUMBER,
    STRING,
    ARRAY,
    OBJECT
}
namespace DataType {
    export function getType(type: string): DataType {
        return Object.values(DataType).indexOf(type.toLocaleUpperCase());
    }

    export function getName(type: DataType): string {
        return DataType[type].toLowerCase();
    }

    export function from(data: any): DataType {
        if (data instanceof Uint8Array)
            return DataType.RAW;
        return getType(typeof data);
    }
}

/** */
export function encodeData(obj: any) {
    const _type = DataType.from(obj);
    let data: Uint8Array
    switch (_type) {
        case DataType.RAW:
            data = obj as Uint8Array;
            break;

        case DataType.NUMBER:
            data = numberToArray(_type);
            break;

        case DataType.STRING:
            data = encodeUTF8(obj as string);
            break;

        case DataType.ARRAY:
            data = concatArrays(...Array.from(obj as any[]).flatMap(value => {
                const data = encodeData(value);
                return [numberToArray(data.length, 8), data]
            }));
            break;

        case DataType.OBJECT:
            data = encodeJSON(obj);
            break;

        default:
            throw new Error("Uknown type");
    }
    return concatArrays(numberToArray(_type), data);
}

/** */
export function decodeData<T>(array: Uint8Array): T {
    const type = array[0];
    let rawData = array.subarray(1), data: T;
    switch (type) {
        case DataType.RAW:
            data = rawData as T;
            break;

        case DataType.NUMBER:
            data = numberFromArray(rawData) as T;
            break;

        case DataType.STRING:
            data = decodeUTF8(rawData) as T;
            break;

        case DataType.ARRAY:
            const arrayData: any[] = [];
            let offset = 0;
            while (offset < rawData.length) {
                const length = rawData.subarray(offset, offset + 8);
                if (length.length < 8)
                    throw new Error('Invalid data length');
                const messageLength = numberFromArray(length);
                offset += 8;
                if (offset + messageLength > rawData.length) {
                    throw new Error('Invalid data length');
                }
                arrayData.push(rawData.subarray(offset, offset + messageLength));
                offset += messageLength;
            }
            data = arrayData as T;
            break;

        case DataType.OBJECT:
            data = decodeJSON(rawData);
            break;

        default:
            throw new Error('Invalid data format');
    }

    return data;
}
import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'os'

function send(channel: string, message: string) {
    console.log(channel)
    return ipcRenderer.invoke(channel, message);
}

export function process_platform() {
    return process.platform
}

export function os_userInfo() {
    return os.userInfo()
}

export async function path_join(...args: [string]) {
    return path.join(...args)
}

export async function fs_readdir(location: string) {
    try {
        let files = await readdir(location)
        return files
    } catch (err) { console.log(err); return '' }
}

export async function fs_readFile(file: string) {
    try {
        console.log(file)
        return await readFile(file)
    } catch (err) { console.log(err); return '' }
}

// thank you claude
export async function fs_readMp3(file: string) {
    try {
        let audio = await readFile(file)
        return `data:audio/mp3;base64,${audio.toString('base64')}`
    } catch (err) { console.log(err) }
}

export async function fs_writeFile(location: string, data: object) {
    try {
        return await writeFile(location, JSON.stringify(data))
    } catch (err) { return err }
}

export {sha256sum, versions, send};

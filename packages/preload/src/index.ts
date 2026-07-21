import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'os'

// after recording this from https://old.reddit.com/r/typescript/comments/11yilc1/how_the_hell_do_you_handle_exceptions_in/jd8a35h/,
//   i realize that maybe i dont actually know how ts works
// i looked it up, that single & is an intersection type, which inserts whatever you want into the lvalue
//   ts is the funniest thing man
function errorNarrower(unknownError: unknown): unknownError is Error & { code: unknown } {
    return unknownError instanceof Error && 'code' in (unknownError as any)
}

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
        if (location == '') {
            return ''
        }
        let files = await readdir(location)
        return files
    } catch (err: unknown) {
        if (errorNarrower(err) && err.code == 'ENOENT') {
            console.log('not a folder')
        }
        return ''
    }
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

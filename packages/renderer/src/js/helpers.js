import { process_platform, os_userInfo, fs_readFile, fs_readdir } from "@app/preload"

export function delay(ms) {
    return new Promise(resolve => { setTimeout(resolve, ms) })
}

export function isLocalhost() {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === ""
}

// I also got this from somewhere, and have now been copying it around. Classic shuffle algo
export function shuffle(list, random=Math.random) {
    let shuffleList = [...list]
    let a = shuffleList.length;
    let tval, rand;

    while (a != 0) {
        rand = Math.floor(random() * a);
        a --;
        tval = shuffleList[a];
        shuffleList[a] = shuffleList[rand];
        shuffleList[rand] = tval;
    }
    return shuffleList;
}

export function chunkList(list, size=10) {
    let chunks = []
    for (let a = 0; a < list.length; a += size) {
        let chunk = list.slice(a, a + size)
        chunks.push(chunk)
    }
    return chunks
}

/***
 * Jquery style $
 * @param {string} elementOrSelector - CSS selector string
 * @return {Element} - first matching Element
 * should probably just use jquery, its small enough. im just not clear on the other benefits
 * i just remembered i used it in the nominees portion, so itll be in later anyways
 * TODO delete this
 */
export function $(elementOrSelector, selector=null) {
    if (selector == null) {
        return document.querySelector(elementOrSelector)
    } else {
        return elementOrSelector.querySelector(selector)
    }
}

export function $$$(elementOrSelector, selector=null) {
    if (selector == null) {
        return document.querySelectorAll(elementOrSelector)
    } else {
        return elementOrSelector.querySelectorAll(selector)
    }
}

/***
 * Python style range function
 * @param {number} from - start value, default 0
 * @param {number} to - optional end value, exclusive
 * range(5) -> [0,1,2,3,4], range(2,5) -> [2,3,4]
 */
export function range(from, to = null) {
    if (to == null) { to = from; from = 0 }
    let init = from, retArr = new Array(to - from)
    while (from < to) { retArr[from - init] = from++ }
    return retArr
}

export function objectSort(obj, member) {
    obj.sort((a, b) => {
        const nameA = a[member].toUpperCase(); // ignore upper and lowercase
        const nameB = b[member].toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    // names must be equal
        return 0;
    });
}

export function objIsEmpty(obj) {
    if (obj == null) {
        return true
    }

    if (typeof obj !== 'object') {
        return true
    }

    if (Object.keys(obj).length == 0) {
        return true
    }

    return false
}

export async function readSettings(settings) {
    let settingsInFolder = (await fs_readdir('./')).includes('settings.json')
    if (objIsEmpty(settings) && settingsInFolder) {
        let jsonData = await fs_readFile('./settings.json')
        return await JSON.parse(new TextDecoder().decode(jsonData))
    }
    return settings
}


export function utcNow() {
    return Math.floor(new Date().getTime() / 1000)
}

export function GameData() {
    return {
        countdown: '',
        defaultDuration: '',
        autoReveal: '',
        music: []
    }
}

export function Category() {
    return {
        tileImg: "",
        songs: []
    }
}

export function Song() {
    return {
        title: '',
        composer: '',
        game: '',
        artist: '',
        album: '',
        year: '',
        soundFile: '',
        startTime: '',
        duration: '',
        albumImg: '',
        backgroundImg: ''
    }
}
import { render } from 'preact'
// import path from 'path'
import { useState, useEffect } from 'preact/hooks'
import { $, $$$, range, GameData, Song, Category } from '../js/helpers.js'
import { signal } from '@preact/signals'
// import * as Settings from '../settings.js'
import '../css/dataViewer.css'
import { fs_readdir, fs_readFile, fs_writeFile } from '@app/preload'

let defaultLocation = "./games/test-game"
let defaultJson = "./data/data.json"
let gameData = GameData()

function testWrite(event) {
    let data = {}
    data.songsLocation = "songs"
    data.albumArtsLocation = "album_art"
    data.backgroundsLocation = "backgrounds"
    data.music = {
        "jrpg":[],
        "rts":[],
        "nintendo":[]
    }
    data.music.jrpg.push({
        "title": "Schala's Theme",
        "composer": "Yasunori Mitsuda",
        "game": "Chrono Trigger",
        "year": 1995,
        "soundFile": "schala.mp3",
        "startTime": "0",
        "backgroundImg": "ct.jpg",
        "albumArtImg": "ct.jpg"
    })
    data.music.jrpg.push({
        "title": "A New Hope",
        "composer": "Masayoshi Soken",
        "game": "Final Fantasy XIV",
        "year": 2013,
        "soundFile": "uldah.mp3",
        "startTime": "0",
        "backgroundImg": "uldah.jpg",
        "albumArtImg": "xivarr.jpg"
    })
    data.music.rts.push({
        "title": "Terran One",
        "composer": "Glenn Stafford",
        "game": "Starcraft",
        "year": 1997,
        "soundFile": "terran.mp3",
        "startTime": "20",
        "backgroundImg": "starcraft.jpg",
        "albumArtImg": "starcraft.jpg"
    })
    data.music.rts.push({
        "title": "Hell March",
        "composer": "Frank Klepacki",
        "game": "Command & Conquer: Red Alert",
        "year": 1995,
        "soundFile": "hellmarch.mp3",
        "startTime": "19",
        "backgroundImg": "cncra.jpg",
        "albumArtImg": "cncra.jpg"
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    }); 
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function testBridge(event) {
    // let result = await window.nodejs.call('test', null)
    console.log(result)
}

function DataTableRows(props) {
    let [extraCategories, setExtraCategories] = useState(0)
    let [albumsFileOptions, setAlbumsFileOptions] = useState([])
    let [bgsFileOptions, setBgsFileOptions] = useState([])
    let [songsFileOptions, setSongsFileOptions] = useState([])
    // console.log(props.gameType)

    useEffect(async () => {
        if (!('root' in props.gameData)) { return }
        console.log('updating found files')
        let albumsInFolder = await fs_readdir(`${props.gameData.root}/${props.gameData.selectedLocation}/albums`)
        setAlbumsFileOptions(albumsInFolder)
        let bgsInFolder = await fs_readdir(`${props.gameData.root}/${props.gameData.selectedLocation}/bgs`)
        setBgsFileOptions(bgsInFolder)
        let songsInFolder = await fs_readdir(`${props.gameData.root}/${props.gameData.selectedLocation}/songs`)
        setSongsFileOptions(songsInFolder)
    }, [props.gameData.root, props.recheckFoldersCount])

    let Categories = props.gameData.music.map((data, idx) => {
        return (
            <CategoryRow id={idx} data={data} gameType={props.gameType}
                albumsFileOptions={albumsFileOptions} bgsFileOptions={bgsFileOptions} songsFileOptions={songsFileOptions} />
        )
    })

    let NewCategories = range(extraCategories).map(num => {
        return (
            <CategoryRow id={100 + num} data={{name: '', tileImg: '', songs: []}} gameType={props.gameType}
                albumsFileOptions={albumsFileOptions} bgsFileOptions={bgsFileOptions} songsFileOptions={songsFileOptions} />
        )
    })

    return(
        <tbody>
            {Categories}
            {NewCategories}
            <tr id='new-category-row'>
                <td> - </td>
                <td> - </td>
                <td> - </td>
                <td> - </td>
                <td> <input type='button' style="color: green;" value='category +' onClick={e => {setExtraCategories(extraCategories + 1)}} /></td>
            </tr>

        </tbody>
    )
}

function CategoryRow(props) {
    let [categoryName, setCategoryName] = useState(props.data.name)
    let [tileImg, setTileImg] = useState(props.data.tileImg)
    let [extraRows, setExtraRows] = useState(0)
    let rowId = 'r' + props.id
    let compressed = false
    let toggleDisplay = (e) => {
        $$$(`#${rowId}`).forEach(a => {
            console.log(a)
            if (compressed) {
                a.style.display = ""
            } else {
                a.style.display="none"
            }
        })
        compressed = !compressed
    }

    let removeCategory = (e) => {
        let treeUp = e.target
        while (treeUp.id != "category-header") {
            treeUp = treeUp.parentNode
        }
        treeUp.classList.add("deleted")
        treeUp = treeUp.nextSibling
        while (treeUp && treeUp.id != "category-header" && treeUp.id != 'new-category-row') {
            console.log(treeUp)
            treeUp.classList.add("deleted")
            treeUp = treeUp.nextSibling
        }
    }

    let SongRows = props.data.songs.map(song => {
        return (
            <SongRow song={song} rowId={rowId} rowName={categoryName} gameType={props.gameType} location={props.selectedLocation} 
                albumsFileOptions={props.albumsFileOptions} bgsFileOptions={props.bgsFileOptions} songsFileOptions={props.songsFileOptions} />
        )
    })

    let NewRows = range(extraRows).map(num => {
        return (
            <SongRow song={Song()} rowId={rowId} rowName={categoryName} gameType={props.gameType} location={props.selectedLocation}
                albumsFileOptions={props.albumsFileOptions} bgsFileOptions={props.bgsFileOptions} songsFileOptions={props.songsFileOptions} />
        )
    })

    return (
    <>
        <tr id='category-header'>
            <td> - </td>
            <td> <input id="tr-category-name" defaultValue={categoryName} onInput={e => setCategoryName(e.currentTarget.value)} /> </td>
            <td> <input id="tr-tile-img" defaultValue={tileImg} onInput={e => setTileImg(e.currentTarget.value)} /> </td>
            <td> <input type='button' value='compress' onClick={toggleDisplay}/> </td>
            <td> <input type='button' style="color: red;" value='DELETE CATEGORY' onClick={removeCategory}/> </td>
        </tr>
        {SongRows}
        {NewRows}
        <tr >
            <td style="border-bottom: 1px solid black;"> - </td>
            <td> <input type='button' style="color: green;" value='song +' onClick={e => {setExtraRows(extraRows + 1)}} /></td>
        </tr>
    </>
    )

}

function SongRow(props) {
    // console.log(props)
	const [title, setTitle] = useState(props.song.title)
	const [composer, setComposer] = useState(props.song.composer)
	const [game, setGame] = useState(props.song.game)
	const [artist, setArtist] = useState(props.song.artist)
	const [album, setAlbum] = useState(props.song.album)
	const [year, setYear] = useState(props.song.year)
	const [soundFile, setSoundFile] = useState(props.song.soundFile)
	const [startTime, setStartTime] = useState(props.song.startTime)
	const [duration, setDuration] = useState(props.song.duration)
	const [background, setBackground] = useState(props.song.backgroundImg)

    let removeSong = (e) => {
        e.target.parentNode.parentNode.classList.add("deleted")
    }

    let gameTypeRows = () => {
        if (props.gameType == "game") {
            return (
                <>
                <td> <input id='tr-composer' type='text' defaultValue={composer} onInput={e => setComposer(e.currentTarget.value)} /> </td>
                <td> <input id='tr-game-name' type='text' defaultValue={game} onInput={e => setGame(e.currentTarget.value)} /> </td>
                </>
            )
        } else if (props.gameType == "music") {
            return (
                <>
                <td> <input id='tr-artist' type='text' defaultValue={artist} onInput={e => setComposer(e.currentTarget.value)} /> </td>
                <td> <input id='tr-album' type='text' defaultValue={album} onInput={e => setGame(e.currentTarget.value)} /> </td>
                </>
            )
        } else {
            return (
                <>
                <td> <input id='tr-composer' type='text' defaultValue={composer} onInput={e => setComposer(e.currentTarget.value)} /> </td>
                <td> <input id='tr-game-name' type='text' defaultValue={game} onInput={e => setGame(e.currentTarget.value)} /> </td>
                <td> <input id='tr-artist' type='text' defaultValue={artist} onInput={e => setComposer(e.currentTarget.value)} /> </td>
                <td> <input id='tr-album' type='text' defaultValue={album} onInput={e => setGame(e.currentTarget.value)} /> </td>
                </>
            )
        }
    }

    let DataListOptions = (optionsList) => {
        if (!optionsList) { return }
        return optionsList.map(o => {
            return (
                <option value={o}></option>
            )
        })
    }

    return (
        <tr id={props.rowId} name={props.rowName}>
            <td> <input type='button' style="color: red;" value='X' onClick={removeSong} /></td>
            <td> <input id='tr-title' type='text' defaultValue={title} onInput={e => setTitle(e.currentTarget.value)} /> </td>
            {gameTypeRows()}
            <td> <input id='tr-year' type='text' defaultValue={year} onInput={e => setYear(e.currentTarget.value)} /> </td>
            <td>
                <input id='tr-sound-file' list='tr-sound-file-datalist' type='text' defaultValue={soundFile} onInput={e => setSoundFile(e.currentTarget.value)} />
                <datalist id='tr-sound-file-datalist'>
                    {DataListOptions(props.songsFileOptions)}
                </datalist>
            </td>
            <td> <input id='tr-start-time' type='text' defaultValue={startTime} onInput={e => setStartTime(e.currentTarget.value)} /> </td>
            <td> <input id='tr-duration' type='text' defaultValue={duration} placeholder={gameData.defaultDuration} onInput={e => setDuration(e.currentTarget.value)} /> </td>
            <td>
                <input id='tr-background' list='tr-background-datalist' type='text' defaultValue={background} onInput={e => setBackground(e.currentTarget.value)} />
                <datalist id='tr-background-datalist'>
                    {DataListOptions(props.bgsFileOptions)}
                </datalist>
            </td>
            <td>
                <input id='tr-album' list='tr-album-datalist' type='text' defaultValue={album} onInput={e => setAlbum(e.currentTarget.value)} />
                <datalist id='tr-album-datalist'>
                    {DataListOptions(props.albumsFileOptions)}
                </datalist>
            </td>
        </tr>
    )
}

function FilesTd(id, folderLocation, stateVal, setStateVal) {
    const [options, setOptions] = useState([])
    console.log(id, folderLocation, stateVal)

    useEffect(async () => {
        let gamesLocation = $('#game-location-input').value
        let filesInFolder = await fs_readFile(`${gamesLocation}/${selectedGame}/${folderLocation}`)
        setOptions(filesInFolder)
    }, [])

    let Options = options.map(file => {
        return (
            <option value={file}></option>
        )
    })

    return (
        <td>
            <input list={id+'-datalist'} id={id} type='text' defaultValue={stateVal} onInput={e => setStateVal(e.currentTarget.value)} />
            <datalist id={id+'-datalist'}>
                {Options}
            </datalist>
        </td>
    )
}

function MetadataTags(props) {
    if (props.gameType == 'game') {
        return (
            <>
            <th>composer</th>
            <th>game</th>
            </>
        )
    } else if (props.gameType == 'music') {
        return (
            <>
            <th>artist</th>
            <th>album</th>
            </>
        )
    } else {
        return (
            <>
            <th>composer</th>
            <th>game</th>
            <th>artist</th>
            <th>album</th>
            </>
        )
    }
}

export default function DataViewer() {
    let [gameType, setGameType] = useState('game')
    let [gamesFound, setGamesFound] = useState([])
    let [selectedLocation, setSelectedLocation] = useState('')
    let [recheckFoldersCount, setRecheckFoldersCount] = useState(0)
    let [saving, setSaving] = useState('')

    let readJson = async function(target) {
        console.log('reading json')

        if (selectedLocation != '') {
            gameData = GameData()
            setSelectedLocation('')
        }
        let root = $('#game-location-input').value
        let selectedFolder = $('#game-folder-select').value
        console.log(selectedFolder)
        if (selectedFolder == '') {
            return
        }
        let filesInFolder = await fs_readdir(`${root}/${selectedFolder}`)
        let jsonFile = filesInFolder.filter(item => item.endsWith('.json'))[0]  // first json file in folder
        // console.log(`${root}\\${selectedFolder}\\${jsonFile}`)
        let jsonData = await fs_readFile(`${root}/${selectedFolder}/${jsonFile}`)
        gameData = await JSON.parse(new TextDecoder().decode(jsonData))
        gameData.root = root
        gameData.selectedLocation = selectedFolder
        setSelectedLocation(selectedFolder)
    }

    // Todo: fix this
    // let reload = async function(target) {
    //     setSelectedGame(false)
    //     let foundFiles = await fs_readdir($('#folder-location-input').value)
    //     let jsonFile = filesInFolder.filter(item => item.endsWith('.json'))[0]  // first json file in folder
    //     let jsonData = await fs_readFile(`${location}\${jsonFile}`)
    //     gameData = jsonData
    //     setSelectedGame(true)
    // }

    // let pickDirectory = async () => {
    //     let handle = await window.showDirectoryPicker()
    //     let sfsd = []
    //     for await (let folder of handle.values()) {
    //         console.log(folder)
    //         for await (let findFile of folder.values()) {
    //             console.log(findFile)
    //             if (findFile.name.endsWith('.json')) {
    //                 console.log('got one: ' + folder.name + '/' + findFile.name)
    //                 console.log(sfsd)
    //                 sfsd.push([folder.name, findFile])
    //             }
    //         }
    //     }
    //     setGamesFound(sfsd)
    // }

    let checkFolderForGames = async () => {
        let filesInFolder = await fs_readdir($('#game-location-input').value)
        if (filesInFolder != "") {
            setGamesFound(filesInFolder)
        }
    }

    let GamesOptions = gamesFound.map((item) => {
        return (
            <option value={item}>{item}</option>
        )
    })

    // let keylogger = 
    // }

    useEffect(() => {
        window.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.keyCode == 83 && !saving) {  // ctrl + s
                console.log('keylogger', saving)
                setSaving(await saveData())
                $('#pop-up-overlay').style.display = 'block'
            }
        })
    }, [])

    useEffect(() => {
        // console.log('use effect', saving)
        if (saving == 'ok') {
            $('#save-confirm-box').innerHTML = 'save done'
            $('#save-confirm-box').classList.remove('background-red')
            $('#save-confirm-box').classList.add('background-green')
            let timer = setTimeout(() => {
                $('#pop-up-overlay').style.display = 'none'
                setSaving('')
            }, 3000);
        } else if (saving == 'fail') {
            console.log('use effect', saving)
            $('#save-confirm-box').innerHTML = 'FAILED'
            $('#save-confirm-box').classList.remove('background-green')
            $('#save-confirm-box').classList.add('background-red')
            let timer = setTimeout(() => {
                $('#pop-up-overlay').style.display = 'none'
                setSaving('')
            }, 3000);
        }
    }, [saving])

    return (
        <div>
            <div id='pop-up-overlay'>
                <div id='save-confirm-box'>dont look at me yet</div>
            </div>
            <div id='file-loading-zone' class='options-zone'>
                <div id='file-loading-eyecatch'>
                    hi
                </div>
                <div id='file-loading-ops'>
                    <div class='label-inputs'>
                        <div class='file-loading-label'>Folder where games are held: </div>
                        <input id='game-location-input' type='text' defaultValue={''} />
                        <input type="button" value='scan folder for games' onClick={checkFolderForGames} />
                    </div>
                    <div class='label-inputs'>
                        <div class='file-loading-label'>select game: </div>
                        <select id='game-folder-select' onChange={readJson}>
                            <option value></option>
                            {GamesOptions}
                        </select>
                        <input type='button' value='recheck folders' onClick={e => setRecheckFoldersCount(recheckFoldersCount + 1)} />
                    </div>
                </div>
            </div>
            <div class='options-zone'>
                <fieldset>
                    <legend>Game Rules</legend>
                    <div class=''>
                        <div class='label-inputs'>
                            <label class='file-loading-label' for='countdown'>Countdown between selecting a category and song starts playing:</label>
                            <input id='countdown-input' name='coundown' type='text' value={gameData.countdown} />
                        </div>
                        <div class='label-inputs'>
                            <label class='file-loading-label' for='duration'>Default song duration:</label>
                            <input id='duration-input' name='duration' type='text' value={gameData.defaultDuration} />
                        </div>
                        <div class='label-inputs'>
                            <label class='file-loading-label' for='autoReveal'>Auto Reveal Song Info after duration expires?</label>
                            <input id='autoReveal-input' name='autoReveal' type='checkbox' checked={gameData.autoReveal} />
                        </div>
                        <div class='label-inputs'>
                            <label class='file-loading-label' for='gameType'>Metadata Labels: </label>
                            <select id='gameType-input' onChange={e => setGameType(e.target.value) }>
                                <option value='game'>Use Composer/Game</option>
                                <option value='music'>Use Artist/Album</option>
                                <option value='both'>Use Both</option>
                            </select>
                        </div>
                    </div>
                    {/* <div>
                        <label for='countdown'>Countdown between selecting a category and song starts playing:</label>
                        <input id='countdown-input' name='coundown' type='text' value={gameData.countdown} />
                    </div>
                    <div>
                        <label for='duration'>Default song duration:</label>
                        <input id='duration-input' name='duration' type='text' value={gameData.defaultDuration} />
                    </div>
                    <div>
                        <label for='autoReveal'>Auto Reveal Song Info after duration expires?</label>
                        <input id='autoReveal-input' name='autoReveal' type='checkbox' checked={gameData.autoReveal} />
                    </div>
                    <div>
                        <label for='gameType'>Metadata Labels</label>
                        <select id='gameType-input' onChange={e => setGameType(e.target.value) }>
                            <option value='game'>Use Composer/Game</option>
                            <option value='music'>Use Artist/Album</option>
                            <option value='both'>Use Both</option>
                        </select>
                    </div> */}
                </fieldset>
            </div>
            <fieldset>
                <legend>Categories and Songs</legend>
                <table>
                    <thead>
                        <tr>
                            <th>delete</th>
                            <th>title</th>
                            <MetadataTags gameType={gameType} />
                            {/* {metadataTags()} */}
                            <th>year</th>
                            <th>sound file</th>
                            <th>start time</th>
                            <th>duration</th>
                            <th>album image</th>
                            <th>background image</th>
                        </tr>
                    </thead>
                    <DataTableRows gameData={gameData} gameType={gameType} recheckFoldersCount={recheckFoldersCount} />
                    <tfoot>
                        <tr>
                            <td>SAVE</td>
                            <td>AFTER</td>
                            <td>EDITING</td>
                        </tr>
                    </tfoot>
                </table>
            </fieldset>
        </div>
    )
}

async function saveData() {
    let saveObj = {}
    saveObj.autoReveal = $('#autoReveal-input').value
    saveObj.countdown = $('#countdown-input').value
    saveObj.defaultDuration = $('#duration-input').value
    saveObj.style = $('#gameType-input').value

    saveObj.music = []
    let rows = $$$('tbody tr')

    rows.forEach(row => {
        if (row.classList.contains("deleted")) {
            console.log('deleted')
            return
        }

        if (row.id == "category-header") {
            let category = $(row, '#tr-category-name').value
            let tileImg = $(row, '#tr-tile-img').value
            saveObj.music.push({
                'name': category,
                'tileImg': tileImg,
                'songs': []
            })
            return
        }

        let category = row.getAttribute('name')
        if (category == null) {
            return
        }

        let song = Song()
        song.title = $(row, '#tr-title').value
        song.composer = ""
        if ($(row, '#tr-composer')) {
            song.composer = $(row, '#tr-composer').value
        }
        song.game = ""
        if ($(row, '#tr-game-name')) {
            song.game = $(row, '#tr-game-name').value
        }
        song.artist = ""
        if ($(row, '#tr-artist')) {
            song.artist = $(row, '#tr-artist').value
        }
        song.album = ""
        if ($(row, '#tr-album')) {
            song.album = $(row, '#tr-album').value
        }
        song.year = $(row, '#tr-year').value
        song.soundFile = $(row, '#tr-sound-file').value
        song.startTime = $(row, '#tr-start-time').value
        song.duration = $(row, '#tr-duration').value
        song.backgroundImg = $(row, '#tr-background').value
        song.albumArtImg = $(row, '#tr-album').value
        saveObj.music.forEach(cat => {
            if (cat.name == row.getAttribute('name')) {
                console.log('adding', song.title, "to", cat.name)
                cat.songs.push(song)
            }
        })
    })
    let confirm = await fs_writeFile(gameData.root + '/' + gameData.selectedLocation + '/data.json', saveObj)
    if (confirm == undefined) {
        return 'ok'
    } else return 'fail'
}

/*********************
 * THIS FUNCTION HERE IS WRONG 
 * RENDER SHOULD ONLY BE CALLED ONCE, EVERYTHING ELSE MUST BE STUFFED IN THERE
 * WHY IS THAT NOWHERE LISTED
 * I AM GOING TO WRITE A BLOG POST
 * I HAVE NO OUTREACH
 * SOMEONE ELSE WILL FALL FOR THIS SAME TRAP
 * ARRRRRGH
 */
// export default function() {
//     render(DataViewer(), document.body)
// }

//todo: DONE new category button
//      DONE data sanitization
//      DONE update song data type in helpers.js
//      DONE add duration
//      DONE scan folders for objs, update inputs with searchable dropdowns
//      DONE actually save file
//      DONE game/music industry mode
//      css
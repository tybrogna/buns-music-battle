import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { $, $$$, range, defaultFolder } from '../js/helpers.js'
import { process_platform, os_userInfo, fs_readdir } from '@app/preload'
// import * as Settings from '../settings.js'
import '../css/landing.css'

function LogoBox(props) {
    return (
        <div id='logo-box'>
            <img class='logo' src='./imgs/logo.webp' />
        </div>
    )
}

function TeamSetup(props) {
    let [teams, setTeams] = useState(0)

    useEffect(() => {
        let teamsAlreadySetUp = () => {
            let numberOfTeams = 0
            let storedTeams = localStorage.getItem('teams')
            let storedPlayers = localStorage.getItem('players')

            if (storedTeams != null) {
                let teams = storedTeams.split(',')
                numberOfTeams = Math.max(numberOfTeams, teams.length)

            }
            if (storedPlayers != null) {

            }
        }

        if (teams == 0) {
            teamsAlreadySetUp()
        }
    })

    let Teams = range(teams).map(item => {
        return (
            <>
            <input type='text' class='team-name-textbox' placeholder='Team Name...' />
            <textarea rows='6' class='players-textbox' cols='40' placeholder='Participants, one per line...' />
            </>
        )
    })

    return (
        <div id='team-setup-box'>
            <input type='button' value='Add Team' onclick={e => {setTeams(teams + 1)}} />
            <div>
                {Teams}
            </div>
        </div>
    )
}

function GameSelect() {
    // let defaultFolder
    // let operatingSystem = process_platform()
    // if (operatingSystem == 'darwin') {
    //     // TODO: fix this
    //     // defaultFolder = `C:\\Users\\${osUserInfo().username}\\Documents\\big-ear-battle-games`
    // } else if (operatingSystem.startsWith('win')) {
    //     defaultFolder = `C:\\Users\\${os_userInfo().username}\\Documents\\big-ear-battle-games`
    // }
    let [ gamesFound, setGamesFound ] = useState([])

    let checkFolderForGames = async () => {
        let foundFiles = await fs_readdir($('#folder-location-input').value)
        setGamesFound(foundFiles)
    }

    useEffect(async () => {
        await checkFolderForGames()
    }, [])

    return (
        <>
        <input id='folder-location-input' type='text' defaultValue={defaultFolder()}/>
        <input type="button" value="check for new games" onClick={checkFolderForGames} />
        <select id='game-folder-select'>
            {gamesFound.map((item) => {
                return (
                    <option value={item}>{item}</option>
                )
            })}
        </select>
        </>
    )
}

function Landing() {

    return (
        <div id='shell'>
            <LogoBox />
            <TeamSetup />
            <GameSelect />
            <div>
                <a href='/files'>file viewer</a>
                <a style="margin-left: 15px;" href='/music-test'>music test</a>
            </div>
            <input type='button' value='Start Game' onclick={e => startGame()}/>
        </div>
    )
}

function startGame(event) {
    let nodes = $$$('.team-name-textbox')
    let teams = Array.from(nodes).map(node => { node.value.replace(',', '.') })
    console.log(teams)

    nodes = $$$('.players-textbox')
    let players = Array.from(nodes).map((node, idx) => {
        let splits = node.value.split('\n')
        splits = splits.map(s => {
            let s2 = s.replace(',', '.')
            return teams[idx] + "|||" + s2
        })
        return splits
    })
    console.log(players)

    let gameFolder = $('#game-folder-select').value

    if (gameFolder == '') {
        console.log("you have to select a game to play")
        return
    }

    if (teams.length != players.length) {
        console.log("a team is missing a name or players")
        return
    }

    localStorage.setItem('teams', teams)
    localStorage.setItem('players', players)
    localStorage.setItem('gameFolder', gameFolder)
    window.open('/game', '_self')
}

export default function() {
    render(Landing(), document.body)
}

//todo: delete the unnecessary setup files
//      splash logo
//      css for buttons
//      animations for buttons
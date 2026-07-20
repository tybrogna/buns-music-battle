import { render } from 'preact'
import { useState, useEffect} from 'preact/hooks';
import { Link, Router, Route } from 'wouter-preact'
import { useHashLocation } from 'wouter-preact/use-hash-location'
// use-hash-location is REQUIRED for electron apps!!!
//   i am never using electron by choice ever again!!!

import Landing from './pages/landing.jsx'
import DataViewer from './pages/dataViewer.jsx'
import Game from './pages/game.jsx'
import MusicTest from './pages/musicTest.jsx'
import FileTest from './pages/fileTest.jsx'


let App = () => (
    <Router hook={useHashLocation}>
        <Route path='/' component={Landing} />
        <Route path='/files' component={DataViewer} />
        <Route path='/file-test' component={FileTest} />
        <Route path='/game' component={Game} />
        <Route path='/music-test' component={MusicTest} />
    </Router>
)

render(<App />, document.querySelector('body'))

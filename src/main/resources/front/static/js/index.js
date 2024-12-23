import "./gameEntities.js"
import "./dialogs.js"
import "./scenes.js"
import {God} from "./core.js"

const sceneTags = new Map([
    ['register', 'sc-reg'],
    ['login', 'sc-log'],
    ['reset-password', 'sc-res'],
    ['lobby', 'sc-lobby'],
    ['game', 'sc-game'],
])
const dialogTags = new Map([
])

const god = new God(sceneTags, dialogTags);




// Listen for hash changes
window.addEventListener('hashchange', ()=> {god.handleAnchorChange()});
god.handleAnchorChange()

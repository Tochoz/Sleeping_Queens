import "./gameEntities.js"
import "./dialogs.js"
import "./scenes.js"
import {God} from "./core.js"
import {RulesScene} from "./rules.js";

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
document.querySelector("#rules").addEventListener("click",
function showRules(){
    let rules = new RulesScene();
    rules.init(this.parentNode)
    this.parentNode.appendChild(rules)
})

// Listen for hash changes
window.addEventListener('hashchange', ()=> {god.handleAnchorChange()});
god.handleAnchorChange()

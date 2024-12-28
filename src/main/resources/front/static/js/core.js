export class God{
    scenes = new Map()
    dialogs  = new Map()
    showedScene;
    showedDialog;
    header;

    constructor(sceneTags, dialogTags) {
        sceneTags.forEach((value, key) => {
            this.scenes.set(key, document.getElementsByTagName(value)[0]);
        });

        dialogTags.forEach((value, key) => {
            this.dialogs.set(key, document.getElementsByTagName(value)[0]);
        });
        console.log(this.scenes);
        this.header = document.querySelector("header");
        if (readCookie('token'))
            this.header.classList.value = 'rized'
        else
            this.header.classList.value = 'not-rized'
    }

    handleAnchorChange() {
        var anchorValue = window.location.hash.substring(1).split('_')[0];
        var anchorArg = window.location.hash.substring(1).split('_').at(-1);
        if (anchorValue === "logout") {
            eraseCookie("token");
            anchorValue = 'login';
        }

        if (readCookie('token')){
            document.querySelector('header #login-tag').innerText = `Привет, ${readCookie('login')}!`
            this.header.classList.value = 'rized'
        }
        else{
            document.querySelector('header #login-tag').innerText = `Привет, кто бы ты ни был!`

            this.header.classList.value = 'not-rized'
        }

        if (!anchorValue || !this.scenes.has(anchorValue)){
            anchorValue = 'lobby';
            window.location.hash = '#lobby';
        }

        var newScene = this.scenes.get(anchorValue);
        var redirect =newScene.redirectScene();
        if (redirect)
            newScene = this.scenes.get(redirect);
        this.showedScene?.hide();
        this.showedScene = newScene;
        this.showedScene.display(anchorArg);
    }
}

export class Scene extends HTMLElement {
    socket;
    constructor() {
        super();
        this.hide()
    }

    display(){
        this.style.display = '';
        this.socket = new WebSocket('/ws');
        this.socket.addEventListener('open',  (event) => {this.socketOpened(event)});
        this.socket.addEventListener('message', (event) => {this.socketRecieved(event)});
        this.socket.addEventListener('error', (event) => {this.socketError(event)});
        this.socket.addEventListener('close', (event) => {this.socketClosed(event)});
    }
    hide(){
        if (this.socket) this?.socket?.send("bye")
        this.style.display = "none";
    }
    redirectScene() {
        return '';
    }

    socketOpened(event){
        console.debug('WebSocket connection opened:', event);
    }
R
    socketRecieved(event){
        console.debug('Message received:', event.data);
    }

    socketClosed(event){
        console.debug('WebSocket connection closed:', event);
        if (event.reason !== "Client said BYE"){
            console.error("внеплановый разрыв сокета ПОЧ?")
            this.socket = new WebSocket('/ws');
            this.socket.addEventListener('open',  (event) => {this.socketOpened(event)});
            this.socket.addEventListener('message', (event) => {this.socketRecieved(event)});
            this.socket.addEventListener('error', (event) => {this.socketError(event)});
            this.socket.addEventListener('close', (event) => {this.socketClosed(event)});

        }
    }

    socketError(event){
        console.error('WebSocket error:', event);
    }
    socketSend(msg){

        console.debug('Sending message:', msg, this.socket);
        if (this.socket.readyState === WebSocket.CONNECTING) {
            setTimeout(()=>{this.socketSend(msg)}, 1000)
            return
        }
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(msg);
            console.debug('Message sent: {}', msg);
        } else {
            console.error('Socket is not ready')
        }
    }
    socketSendMethod(tk, method, args){
        var data = { tk: tk, method: method, args: args}
        var msg =JSON.stringify(data)
        this.socketSend(msg)
    }

}

export class MyDialog extends HTMLElement {
    scene;
    constructor() {
        super();

    }

    connectedCallback(){

    }

    init(scene){
        this.scene=scene;
    }

    display(){
        this.style.display = '';
    }
    hide(){
        this.style.display = "none";
    }

    close(){
        console.log('dialog close')
        this.scene.closeDialog(this)
    }

    submit(){
        console.log('dialog submit')
    }
}


export function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

export function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

export function eraseCookie(name) {
    createCookie(name,"",-1);
}
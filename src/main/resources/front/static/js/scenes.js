import * as core from "./core.js";
import * as dialogs from "./dialogs.js";
import {readCookie} from "./core.js";
import {WaitRoomStartDialog} from "./dialogs.js";

class FormScene extends core.Scene{
    form;
    constructor() {
        super();
        this.form = this.querySelector('form');
        this.form.addEventListener(
            'submit', (e) => { this.onSubmit(e) }
        )
    }

    onSubmit(e){
        e.preventDefault();
    }

    socketOpened(event) {
    }
}

export class RegistrationScene extends FormScene{
    onSubmit(e) {
        super.onSubmit(e)
        var formData = new FormData(this.form)
        var pswd = formData.get('password');
        var pswd_c = formData.get('password-confirm');
        if (pswd !== pswd_c){
            alert("Пароли не совпадают");
            return;
        }
        console.log(Object.fromEntries(formData))
        this.socketSendMethod(null, "register", Array.from(formData.values()).slice(0, 2))
    }

    socketRecieved(event) {
        super.socketRecieved(event);
        var data = JSON.parse(event.data);
        switch (data["method"]){
            case "register":
                this.processResponse(data)
                break
            default:
                console.log("Login scene handled invalid socket message: ", event.data)
        }
    }
    processResponse(data){
        switch (data['status']){
            case "success":
                core.createCookie("token", data["payload"]["token"], 30);
                document.location.hash = "#lobby";
                break;
            case "already in use":
                alert("Такое имя пользователя уже занято");
                break
            default:
                alert(data['status'])
        }
    }
}
customElements.define('sc-reg', RegistrationScene);

export class LoginScene extends FormScene {
    onSubmit(e) {
        super.onSubmit(e)
        var formData = new FormData(this.form)
        console.log(Object.fromEntries(formData))
        this.socketSendMethod(null, "login", Array.from(formData.values()).slice(0, 2))
    }

    socketRecieved(event) {
        super.socketRecieved(event);
        var data = JSON.parse(event.data);
        switch (data["method"]) {
            case "login":
                this.processResponse(data)
                break
            default:
                console.log("Login scene handled invalid socket message: ", event.data)
        }
    }

    processResponse(data) {
        switch (data['status']) {
            case "success":
                core.createCookie("token", data["payload"]["token"], 30);
                document.location.hash = "#lobby";
                break;
            case "login not found":
                alert("Имя пользователя не найдено");
                break
            case "wrong password":
                alert("Неверный пароль");
                break
            default:
                alert(data['status'])
        }
    }
}
customElements.define('sc-log', LoginScene);

export class ResetPswdScene extends FormScene{}
customElements.define('sc-res', ResetPswdScene);

export class LobbyScene extends core.Scene{
    rooms;
    dialog;
    constructor() {
        super();
        this.rooms = this.querySelector(".rooms")
        this.querySelector("#join-button").addEventListener('click', (e) => {this.join(e)})
        this.querySelector("#create-button").addEventListener('click', (e) => {
            this.create(e)
        })

    }

    isInFocus(){
        return this.dialog==null;
    }

    display(arg) {
        super.display();
        var tk = core.readCookie('token');
        console.log(tk)
        this.socketSendMethod(tk, "getOpenRooms", [])
    }


    redirectScene() {
        if (!core.readCookie('token')) return "login";
        return super.redirectScene();
    }

    closeDialog(dialog){
        this.removeChild(dialog)
        this.dialog=null
        this.classList.remove('unfocused')
    }

    submitCreateDialog(dialog, data){
        console.log('Scene: dialog create submitted ', data)
        this.removeChild(dialog)
        this.dialog=null
        let tk = core.readCookie('token');

        this.socketSendMethod(tk, "createRoom", data)
        this.classList.remove('unfocused')
    }
    submitJoinDialog(dialog, code){
        console.log('Scene: dialog join submitted ', code)
        this.removeChild(dialog)
        this.dialog=null
        let tk = core.readCookie('token');
        this.socketSendMethod(tk, "createRoom", [code])
        this.classList.remove('unfocused')
    }

    create(e){
        if (this.isInFocus()) {
            console.log("Create called")
            this.dialog = new dialogs.CreateDialog();
            this.dialog.init(this);
            this.classList.add('unfocused')
        }
    }

    join(e){
        if (this.isInFocus()) {
            console.log("Join called")
            this.dialog = new dialogs.InviteDialog();
            this.dialog.init(this);
            this.classList.add('unfocused')
        }
    }

    joinOpen(id){
        if (this.isInFocus()) {
            this.socketSendMethod(core.readCookie('token'), "userJoinOpenRoom", [id])
        }
    }

    socketRecieved(event) {
        let data = JSON.parse(event.data);
        console.log("Got WebSocket data ", data)
        switch (data["method"]){
            case "getOpenRooms":
                this.processOpenRooms(data)
                break
            case "was createRoom":
                let tk = core.readCookie('token');
                this.socketSendMethod(tk, "getOpenRooms", [])
                if (this.dialog instanceof WaitRoomStartDialog){
                    this.socketSendMethod(tk, "getRoomInfo", [this.dialog.idRoom])
                }
                break
            case "getRoomInfo":
                if (this.dialog instanceof WaitRoomStartDialog){
                    this.updateWaitDialog(data);
                }
                break
            case "userJoinOpenRoom":
            case "userJoinCloseRoom":
            case "createRoom":
                switch (data["status"]){
                    case "joined":
                    case "joined last":
                    case "success":
                        this.showWaitDialog(data['payload'])
                        break
                    default:
                        alert(data["status"]);
                        break
                }
                break
            default:
                console.log("Login scene handled invalid socket message: ", event.data)
        }
    }

    leave(idRoom){
        console.log("Leave called")
        if (idRoom) {
            this.socketSendMethod(core.readCookie('token'), "userLeaveRoom", [idRoom])
        }
    }

    processOpenRooms(data){
        var rows = Array.from(data['payload']['openRooms'])
        this.rooms.innerHTML=""
        rows.forEach((row) => {
            this.rooms.appendChild(new RoomRow(row, this))
        })
    }

    updateWaitDialog(data){
        if (data['status']==="waiting room success")
            this.dialog.updateData(data['payload']);
        else if ("running room success") {
            let roomId = this.dialog.idRoom;
            this.dialog.close(this.dialog)
            window.location.hash = `#game_${roomId}`;
        }
    }

    showWaitDialog(data){
        if (this.isInFocus()) {
            console.log("Room wait called")
            this.dialog = new dialogs.WaitRoomStartDialog();
            this.dialog.init(this, data);
            this.classList.add('unfocused')
        }
    }
}
customElements.define('sc-lobby', LobbyScene);

class RoomRow extends HTMLElement{
    scene; id;
    constructor(data,scene) {
        super();
        this.updateData(data)
        this.scene = scene
    }

    updateData(data){
        if (data['joined']){
            this.classList.add('joined')
        }
        this.id = data['id_room']
        var duration = data['turn_duration']
        var playerList = Array.from(data["players_list"])
        var players = data['players']
        var maxPlayers = data['max_players']


        this.innerHTML = `
            <div class="id">${this.id}</div>
            <div class="duration">${duration}</div>
            <div class="player-list">${playerList}</div>
            <div class="players">${players}/${maxPlayers}</div>
            <button type="submit">Войти</button>
        `
        this.querySelector("button").addEventListener('click',
            (e)=>{this.scene.joinOpen(this.id)}
        )
    }
}
customElements.define('en-room', RoomRow);

export class GameScene extends core.Scene{
    gameId
    constructor() {
        super();

    }
    display(arg) {
        super.display();
        this.gameId = arg;

    }
}
customElements.define('sc-game', GameScene);




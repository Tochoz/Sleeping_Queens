import * as core from "./core.js";
import * as dialogs from "./dialogs.js";
import {eraseCookie, readCookie} from "./core.js";
import {WaitRoomStartDialog, WinDialog} from "./dialogs.js";
import {Card, FlippedQueenn, Player, Queen} from "./gameEntities.js";

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
    typedLogin
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
        this.typedLogin = formData.get('login')
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
                core.createCookie("login", this.typedLogin, 30);

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
    typedLogin;
    onSubmit(e) {
        super.onSubmit(e)
        var formData = new FormData(this.form)
        console.log(Object.fromEntries(formData))
        this.typedLogin = formData.get('login')
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
                core.createCookie("login", this.typedLogin, 30);
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
    openrooms;
    runningrooms;
    dialog;
    ingameSection
    lastGetInfo = 0;
    lastGetOpen = 0;
    updateInterval
    constructor() {
        super();
        this.openrooms = this.querySelector("#open-rooms")
        this.runningrooms = this.querySelector("#in-game-rooms")
        this.ingameSection = this.querySelector("#in-game-section")
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
        this.lastGetOpen=0
        this.lastGetInfo=0
        this.socketSendMethod(tk, "getUserRooms", [])
        this.updateInterval = setInterval(()=>{this.plainUpdate()}, 1000)
    }

    hide() {
        super.hide();
        clearInterval(this.updateInterval)
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
        this.socketSendMethod(tk, "userJoinCloseRoom", [code])
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

    plainUpdate(){
        if (this.dialog instanceof WaitRoomStartDialog)
            this.lastGetInfo++
        this.lastGetOpen++
        let tk = readCookie('token')
        if (!tk) window.location.hash = "#login"

        if (this.dialog instanceof WaitRoomStartDialog && this.lastGetInfo>10) {
            this.socketSendMethod(tk, "getRoomInfo", [this.dialog.idRoom])
            this.lastGetInfo = 0
            console.log("plain update info")
        }
        if (this.lastGetOpen>10) {
            this.socketSendMethod(tk, "getOpenRooms", [])
            this.socketSendMethod(tk, "getUserRooms", [])
            this.lastGetOpen = 0
            console.log("plain update rooms")
        }


    }

    socketRecieved(event) {
        let data = JSON.parse(event.data);
        console.log("Got WebSocket data ", data)
        if (data.status === 'not authorized'){
            eraseCookie('token')
            window.location.hash = '#login'
        }
        switch (data["method"]){
            case "getOpenRooms":
                this.processOpenRooms(data)
                break
            case "getUserRooms":
                this.processRunningRooms(data)
                break
            case "was createRoom":
                let tk = core.readCookie('token');
                this.socketSendMethod(tk, "getOpenRooms", [])
                this.socketSendMethod(tk, "getUserRooms", [])
                if (this.dialog instanceof WaitRoomStartDialog){
                    this.socketSendMethod(tk, "getRoomInfo", [this.dialog.idRoom])
                }
                this.lastGetOpen=0
                this.lastGetInfo=0
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
        this.openrooms.innerHTML=""
        rows.forEach((row) => {
            this.openrooms.appendChild(new RoomRow(row, false, this))
        })
    }

    processRunningRooms(data){
        var rows = Array.from(data['payload']['userRooms'])
        if (rows.length > 0)
            this.ingameSection.classList.value = 'showed'
        else
            this.ingameSection.classList.value = ''

        this.runningrooms.innerHTML=""
        rows.forEach((row) => {
            this.runningrooms.appendChild(new RoomRow(row, true, this))
        })
    }



    updateWaitDialog(data){
        if (data['status']==="waiting room success")
            this.dialog.updateData(data['payload']);
        else if ("running room success") {
            let roomId = this.dialog.idRoom;
            this.dialog.close(null)
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
    constructor(data, isRunning ,scene) {
        super();
        this.updateData(data, isRunning)
        this.scene = scene
    }

    updateData(data, isRunning){
        if (data['joined']){
            this.classList.add('joined')
        }
        this.id = data['id_room']
        var duration = data['turn_duration']
        var playerList = Array.from(data["players_list"])
        var players = data['players']
        var maxPlayers = data['max_players']

        if (isRunning)
            this.innerHTML = `
                <div class="id">${this.id}</div>
                <div class="list">${playerList}</div>
                <div class="turn">${duration}</div>
                <div class="slots"></div>
                <button type="submit" class="btn" onclick="changeLocation('#game_${this.id}')">Вернуться</button>
            `
        else {
            this.innerHTML = `
                <div class="id">${this.id}</div>
                <div class="list">${playerList}</div>
                <div class="turn">${duration}</div>
                <div class="slots">${players}/${maxPlayers}</div>
                <button type="submit" class="btn">Войти</button>
            `
            this.querySelector("button").addEventListener('click',
                (e) => {
                    this.scene.joinOpen(this.id)
                }
            )
        }
    }
}
customElements.define('en-room', RoomRow);

export class GameScene extends core.Scene{
    gameId;
    playerId;
    myQueens;
    myCards;
    table;
    turnPlayerId;
    turnDisplay
    playersRoot;
    deck;
    used;
    selectedCards = [];
    targetQueen;
    tableTarget;
    endTurnBtn;
    timer
    timerInterval;
    secondLeft;
    plyrs;
    tablo;
    attackInfo;
    isAttackOnMe=false;

    tableRoot;
    playersRoot;

    constructor() {
        super();
        this.table = this.querySelector("#table-queens");
        this.myCards = this.querySelector("#hand-cards")
        this.myQueens = this.querySelector("#hand-queens")
        this.playersRoot = this.querySelector("#players")
        this.deck = this.querySelector("#deck")
        this.used = this.querySelector("#used")
        this.turnDisplay = this.querySelector("#turn")
        this.timer = this.querySelector("#timer")
        this.tablo = this.querySelector("#tablo")
        this.attackInfo = this.querySelector("#attack-info")
        this.tableRoot = this.querySelector("game-table")
        this.endTurnBtn = this.querySelector("#end-turn")
        this.endTurnBtn.addEventListener("click", (e)=>{this.endTurn(e)})
    }
    display(arg) {
        super.display();
        this.gameId = parseInt(arg);
        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
    }

    update(ans){

        let data = ans["payload"];
        let attack = data["attack"]
        this.playerId = parseInt(data["id_player"])
        this.isAttackOnMe=false
        this.selectedCards = []
        this.myCards.innerHTML='';
        Array.from(data["handCards"]).forEach((row) => {
            this.myCards.appendChild(new Card(row, this))
        })
        this.myQueens.innerHTML='';
        Array.from(data["handQueens"]).forEach((row) => {
            this.myQueens.appendChild(new Queen(row, attack?.target_queen?.id_queen, true, this))
        })

        this.turnPlayerId = parseInt(data["turnPlayer"])

        this.plyrs = new Map(Array.from(data["otherPlayers"]).map(item => [item["id_player"], item]));
        let plyrs = this.plyrs;
        let ids  = Array.from(data["otherPlayers"]).map(item => item["id_player"])
        let mid = 0;
        while (ids[mid] < this.playerId)
            mid++
        let start = mid % ids.length;
        this.playersRoot.innerHTML = "<tooltip>Выберите Королеву игрока чтобы напасть</tooltip>"
        this.playersRoot.appendChild(new Player(plyrs.get(ids[start]), ids[start] === this.turnPlayerId, attack?.id_target_player === ids[start], attack?.target_queen?.id_queen, this));
        mid = (mid % ids.length + 1) % ids.length
        while (mid !== start){
            this.playersRoot.appendChild(new Player(plyrs.get(ids[mid]), ids[mid] === this.turnPlayerId, attack?.id_target_player === ids[mid], attack?.target_queen?.id_queen, this));
            mid = (mid + 1) % ids.length
        }


        if (attack) {
            console.log("ATTTACKKKK!!!")
            if (attack.id_target_player === this.playerId){
                this.tablo.classList.value = 'victim'
                this.isAttackOnMe = true;
                this.endTurnBtn.innerHTML = "Закончить ход"
                this.endTurnBtn.classList.value = ""
                this.attackInfo.innerHTML = `Вас атакуют! <br> Картой «${attack.attack_card.value}»<br>защищайтесь<br>или отдайте королеву`

            } else {
                this.attackInfo.innerText = `Атака на ${plyrs.get(attack.id_target_player)['login']} картой «${attack.attack_card.value}»`
            }

        } else {
            this.tablo.classList.value = ''
            this.attackInfo.innerText = ""
            this.endTurnBtn.innerHTML = "Завершить ход"
        }

        if (this.playerId === this.turnPlayerId) {
            this.turnDisplay.innerHTML = `Вы ходите`
            this.classList.value = ''
            this.updateHand()
        }
        else {
            this.turnDisplay.innerHTML = `Ходит «${plyrs.get(this.turnPlayerId)['login']}»`
            this.classList.value = 'noturn'

            this.targetQueen = null
            this.tableTarget = null
            this.endTurnBtn.classList.value = "disabled"
        }

        this.table.innerHTML=""
        let positions = new Set(data["tableQueensPositions"])
        for (let i=1; i<=12; i++){
            this.table.appendChild(new FlippedQueenn(i, positions.has(i), this))
        }
        let [hours, minutes, seconds] = data["expiresIn"].split(':').map(Number);

        // Calculate the total number of seconds
        this.secondLeft = (hours * 3600) + (minutes * 60) + parseInt(seconds);
        this.initTimer()
    }

    redirectScene() {
        if (!core.readCookie('token')) return "login";
        return super.redirectScene();
    }

    socketRecieved(event) {
        let data = JSON.parse(event.data);
        console.debug("Got WebSocket data ", data)
        switch (data["method"]){
            case "getRoomInfo":
                switch (data["status"]){
                    case "running room success":
                        this.update(data)
                        break
                    case "game finished":
                        let idWin = parseInt(data.payload.wonPlayer)
                        let d = new WinDialog()
                        if (idWin===this.playerId) {
                            d.init(this, true, null)
                        }
                        else {
                            d.init(this, false, this.plyrs?.get(idWin)["login"])
                        }
                        clearInterval(this.timerInterval)
                        break
                    default:
                        alert(data["status"])
                }

                break
            case "getAttackInfo":
                //todo
                break
            case "userLeaveRoom":
                // todo
                break
            case "playDigits":
                switch (data["status"]) {
                    case "success":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    case "not player turn":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    default:
                        alert(data['status'])
                }
                break
            case "playAttack":
                switch (data["status"]){
                    case "success":
                        this.update(data)
                        break
                    default:
                        alert(data["status"])
                }
                break
            case "playDefend":
                switch (data["status"]) {
                    case "success defend":
                    case "success skip defend":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    case "not player turn":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    default:
                        alert(data['status'])
                }
                break
            case "playKing":
                switch (data["status"]) {
                    case "success":
                    case "success got unsuitable queen":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    case "not player turn":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    case "won":
                        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                        break
                    default:
                        alert(data['status'])
                }
                break
            case "was turn":
                this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
                break
            default:
                console.error("Game scene handled invalid socket message: ", event.data)
        }
    }

    addDigit(card){
        console.log(this.selectedCards)
        if (this.selectedCards.length >= 3) return false
        if (this.selectedCards.length > 0 && !this.selectedCards[0].isDigit()) return false
        this.selectedCards.push(card)
        return true
    }

    focusTo(place) {
        switch (place){
            case 'table':
                this.tableRoot.classList.value = 'focus'
                this.playersRoot.classList.value = ''
                break
            case 'enemy':
                this.tableRoot.classList.value = ''
                this.playersRoot.classList.value = 'focus'
                break
            default:
                this.tableRoot.classList.value = ''
                this.playersRoot.classList.value = ''
        }
    }

    addNonDigit(card){
        console.log(this.selectedCards)
        if (this.selectedCards.length > 0) return false
        this.selectedCards.push(card)
        return true
    }
    updateHand(){
        this.focusTo("")
        if (this.selectedCards.length === 0 && !this.isAttackOnMe) {
            this.endTurnBtn.classList = 'disabled'

            this.tableTarget?.wasDiselected()
            this.targetQueen?.wasDiselected()
            return
        }

        this.endTurnBtn.classList = ''
        this.endTurnBtn.innerHTML = 'Завершить ход'
        if (this.isAttackOnMe){
            if (this.selectedCards.length === 0)
                this.endTurnBtn.innerHTML = 'Сдать королеву'
            else
                this.endTurnBtn.innerHTML = 'Защититься'
            return;
        }

        if (this.selectedCards[0].isKing()){
            this.focusTo('table')
            if (this.tableTarget){
                this.endTurnBtn.innerHTML = 'Пробудить'
            }
            else {
                this.endTurnBtn.innerHTML = 'Сбросить'

            }
        }
        if (this.selectedCards[0].isAttack()){
            this.focusTo('enemy')
            if (this.targetQueen){
                this.endTurnBtn.innerHTML = 'Атаковать'
            }
            else {
                this.endTurnBtn.innerHTML = 'Сбросить'
            }
        }
        if (this.selectedCards[0].isDefend()){
            this.endTurnBtn.innerHTML = 'Сбросить'
        }

        if (this.selectedCards[0].isDigit()){
            this.endTurnBtn.innerHTML = 'Сбросить'
        }

        if (this.tableTarget && this.selectedCards[0] && !(this.selectedCards[0].isKing()))
            this.tableTarget.wasDiselected()
        if (this.targetQueen && this.selectedCards[0] && !(this.selectedCards[0].isAttack()))
            this.targetQueen.wasDiselected()

    }

    endTurn(e){
        let tk = readCookie('token')

        if (this.isAttackOnMe){
            this.focusTo('')
            this.socketSendMethod(tk, "playDefend", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
            ])
            return
        }
        if (this.selectedCards[0].isDefend()){
            this.focusTo('')
            this.socketSendMethod(tk, "playDigits", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
                null,
                null
            ])
            return
        }

        if (this.selectedCards[0].isDigit()){
            this.focusTo('')
            this.socketSendMethod(tk, "playDigits", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
                this.selectedCards[1] === undefined? null: this.selectedCards[1].idCard,
                this.selectedCards[2] === undefined? null: this.selectedCards[2].idCard,
            ])
            return
        }
        if (this.selectedCards[0].isKing()){
            this.focusTo('')
            if (!this.tableTarget) this.socketSendMethod(tk, "playDigits", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
                null,
                null,
            ])
            else this.socketSendMethod(tk, "playKing", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
                this.tableTarget.position
            ])
            return
        }

        if (this.selectedCards[0].isAttack()){
            this.focusTo('')
            if (!this.targetQueen) this.socketSendMethod(tk, "playDigits", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
                null,
                null,
            ])
            else this.socketSendMethod(tk, "playAttack", [
                this.gameId,
                this.selectedCards[0] === undefined? null: this.selectedCards[0].idCard,
                this.targetQueen.idQueen
            ])
        }
    }

    leaveDialog(dialog){
        this.removeChild(dialog)
        window.location.hash="#lobby"
    }

    handleAttackInfo(data){}

    handleLeaveInfo(data){}

    initTimer() {
        clearInterval(this.timerInterval);
        // Calculate the minutes and seconds
        let seconds = this.secondLeft
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        // Update the timer display
        this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        this.timerInterval = setInterval(()=>{this.updateTimer()}, 1000);
    }

    timerFinished() {
        console.warn("timer left updated")
        this.socketSendMethod(readCookie("token"), "getRoomInfo", [this.gameId])
    }

    updateTimer() {
        // Get the remaining time
        let timeLeft = --this.secondLeft

        // If the time is not up, update the timer
        if (timeLeft >= 0) {

            // Calculate the minutes and seconds
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;

            // Update the timer display
            this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // If the time is up, stop the timer and call the timerFinished function
            clearInterval(this.timerInterval);
            this.timerFinished();
        }
    }

}customElements.define('sc-game', GameScene);

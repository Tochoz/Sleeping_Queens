import * as core from "./core.js";


export class InviteDialog extends core.MyDialog{
    closeBtn;
    submitBtn;
    input;
    constructor() {
        super();
        this.classList.add('dialog')
        this.innerHTML=`
            <h2>Вход</h2>
            <label for="code">
            <span id="label">Введите код приглашения</span><br>
            <input name="code" id="input" type="text" placeholder="" value="" maxlength="6" required>
            </label>
            <div class="controls"><button id="close" type="submit">Назад</button>
            <button id="submit" type="submit">Далее</button></div>
            
        `
        this.closeBtn = this.querySelector("#close")
        this.submitBtn = this.querySelector("#submit")
        this.input = this.querySelector("#input")
        this.closeBtn.addEventListener('click', (e)=>{this.close(e)})
        this.submitBtn.addEventListener('click', (e)=>{this.submit(e)})
    }

    init(scene) {
        super.init(scene);
        scene.appendChild(this)
    }


    submit() {
        this.scene.submitJoinDialog(this, this.input.value);
    }
    close() {
        super.close();
    }
}customElements.define('di-invite', InviteDialog);


export class CreateDialog extends core.MyDialog{
    closeBtn;
    submitBtn;
    duration;
    players;
    isOpen;
    constructor() {
        super();
        this.classList.add('dialog')
        this.innerHTML=`
            <h2>Создание комнаты</h2>
            <label for="duration">
            <span id="label">Секунд на ход (>20)</span><br>
            <input name="duration" id="duration" type="number" value="40" min="20" max="600" required>
            </label>
            <label for="players">
            <span id="label">Количество игроков от 2 до 5</span><br>
            <input name="players" id="players" type="number" value="3" min="2" max="5" required>
            </label>
            <label for="isOpen" class="checkbox">
            <input name="isOpen" id="isOpen" type="checkbox" value="on"> <span id="label">Открытая игра</span>
            </label>
            <div class="controls"><button id="close" type="submit">Назад</button>
            <button id="submit" type="submit">Далее</button></div>
            
        `
        this.closeBtn = this.querySelector("#close")
        this.submitBtn = this.querySelector("#submit")
        this.duration = this.querySelector("#duration")
        this.players = this.querySelector("#players")
        this.isOpen = this.querySelector("#isOpen")
        this.closeBtn.addEventListener('click', (e)=>{this.close(e)})
        this.submitBtn.addEventListener('click', (e)=>{this.submit(e)})
        this.isOpen.checked=true
    }

    init(scene) {
        super.init(scene);
        scene.appendChild(this)
    }


    submit() {
        this.scene.submitCreateDialog(this, [parseInt(this.duration.value), this.isOpen.checked, parseInt(this.players.value)]);
    }
    close() {
        super.close();
    }
}customElements.define('di-create', CreateDialog);

export class WaitRoomStartDialog extends core.MyDialog{
    closeBtn;
    submitBtn;
    duration;
    players;
    isOpen;
    idRoom;
    constructor() {
        super();
    }

    init(scene, data) {
        super.init(scene);
        scene.appendChild(this)

        this.classList.add('dialog')
        this.idRoom = data['id_room']
        this.updateData(data)
    }
    updateData(data){
        this.isOpen = data['invite_code'] == null
        this.innerHTML=`
            <h2>Комната #${this.idRoom}</h2>
            <p>Секунд на ход: ${data['turn_duration']}</p>
            <p>Игроки: ${data['players_list']}</p>
            <p>Мест: ${data['players']}/${data['max_players']}</p>
            <div class="wait">Ждём заполнения...</div>
            <div class="controls">
                <button id="close" type="submit">Выйти</button>
            </div>
        `
        this.closeBtn = this.querySelector("#close")
        this.closeBtn.addEventListener('click', (e)=>{this.close(e)})
    }
    close(e) {
        if (e != null)
            this.scene.leave(this.idRoom)
        super.close();
    }
}customElements.define('di-join', WaitRoomStartDialog);

export class WinDialog extends core.MyDialog{
    closeBtn;
    input;
    constructor() {
        super();

    }

    init(scene, isMe, who) {
        this.classList.value = 'dialog'
        if (isMe)
            this.innerHTML=`
                <h2>Вход</h2>
                <p>
                    Вы выиграли!
                </p>
                <div class="controls">
                <button id="close" type="submit">Выход</button>
                </div>
                
            `
        else
            this.innerHTML=`
                <h2>Игра завершена</h2>
                <p>
                    Вы проиграли :(<br>
                    победил игрок ${who}
                </p>
                <div class="controls">
                <button id="close" type="submit">Выход</button>
                </div>
            `

        this.closeBtn = this.querySelector("#close")
        this.closeBtn.addEventListener('click', (e)=>{this.close(e)})
        super.init(scene);
        scene.appendChild(this)
    }

    close() {
        this.scene.leaveDialog(this)
    }
}customElements.define('di-win', WinDialog);

export class Selectable extends HTMLElement{
    selected;
    game;
    constructor(game) {
        super();
        this.game = game;
        this.selected = false;
        this.addEventListener("click", (e) => {this.clicked()})
    }

    clicked(){
        if (this.selected)
            this.wasDiselected();
        else
            this.wasSelected();
    }

    wasSelected(){
        console.log("Selectable was selected");
        this.selected = true;
        this.classList.add("selected")
    }

    wasDiselected(){
        console.log("Selectable was diselected");
        this.selected = false;
        this.classList.remove("selected");
    }

    render() {
        const cardElement = document.createElement('div'); // Создаем новый div элемент
        cardElement.className = 'card'; // Устанавливаем класс для стилей
        cardElement.innerText = this.name; // Устанавливаем текст внутри элемента
        return cardElement; // Возвращаем созданный элемент
    }
}

export class Card extends Selectable{
    idCard;
    value;
    constructor(data, game) {
        super(game);
        this.idCard = parseInt(data["id_card"]);
        this.value = data["value"];
        let postfix = ""
        if (this.value === "Король")
            postfix = this.idCard % 8;
        if (this.value === "Рыцарь")
            postfix = this.idCard % 4;
        this.style.backgroundImage = `url("static/img/cards/${this.value}${postfix}.jpg")`

    }
    isAttack(){
        return this.value === "Рыцарь" || this.value === "Сонное Зелье"
    }

    isDefend(){
        return this.value === "Дракон" || this.value === "Волшебная Палочка"
    }

    isKing(){
        return this.value === "Король"
    }


    isDigit(){
        return !this.isDefend() && !this.isAttack() && !this.isKing()
    }



    wasSelected() {
        if (this.isDigit()){
            if (this.game.addDigit(this)) super.wasSelected();
            this.game.updateHand()
            return;
        }
        if (this.isDefend())
            if (this.game.addNonDigit(this)) super.wasSelected();
        if (this.isAttack() || this.isKing())
                    if (this.game.addNonDigit(this)) super.wasSelected();
        this.game.updateHand()
    }
    wasDiselected() {
        let indextodelete = this.game.selectedCards.indexOf(this)
        this.game.selectedCards.splice(indextodelete, 1)
        super.wasDiselected();
        this.game.updateHand()
    }
}customElements.define("en-card", Card)

export class FlippedQueenn extends Selectable{
    position;
    isActive;
    constructor(position, isActive, game) {
        super(game);
        this.position = position
        this.isActive = isActive
        if (!isActive)
            this.classList.add("passive")
    }

    wasSelected() {
        if (this.game.selectedCards.length===1 && this.game.selectedCards[0].isKing()) {
            this.game.tableTarget?.wasDiselected()
            super.wasSelected()
            this.game.tableTarget = this;
            this.game.updateHand()
        }
    }
    wasDiselected() {
        super.wasDiselected();
        this.game.tableTarget = null;
        this.game.updateHand()
    }


}customElements.define("en-flipqueen", FlippedQueenn)

export class Queen extends Selectable {
    idQueen;
    type;
    value;
    isMy;
    constructor(data, targetId, isMy, game) {
        super(game);
        this.value = parseInt(data["value"]);
        this.idQueen = parseInt(data["id_queen"]);
        this.type = data["type"];
        this.isMy = isMy;
        if (targetId && parseInt(targetId) === this.idQueen) this.classList.add('target')
        this.style.backgroundImage = `url("static/img/queens/${this.type}.jpg")`
    }


    wasSelected() {
        if (!this.isMy && this.game.selectedCards.length===1 && this.game.selectedCards[0].isAttack()) {
            this.game.targetQueen?.wasDiselected();
            this.game.targetQueen = this;
            super.wasSelected();
            this.game.updateHand()
        }
    }
    wasDiselected() {
        super.wasDiselected();
        if (this.game.targetQueen===this) {
            this.game.targetQueen = null;
            this.game.updateHand()
        }
    }
}customElements.define("en-queen", Queen)

export class Player extends HTMLElement {
    id;
    login;
    queens;
    game;
    constructor(data, isTurn, isVictim, targetId, game) {
        super();
        this.game = game;
        this.update(data, targetId);
        if (isVictim) this.classList.add("victim");
        else if (isTurn) this.classList.add("turned");
    }
    update(data, targetId){
        this.login = data["login"]; // Имя игрока
        this.id = data["id"];
        this.innerHTML = `
            <player-head>
                <img src="static/vector/Avatar.svg" class="ava">
                <div class="login" id="login">${this.login}</div>
            </player-head>
            <player-queens id="queens">
            </player-queens>
        `
        this.queens = this.querySelector("#queens");
        Array.from(data["queens"]).forEach((row) => {
            this.queens.appendChild(new Queen(row, targetId, false, this.game))
        })
    }

}customElements.define("en-player", Player);
export class Selectable extends HTMLElement{
    constructor() {
        super();

    }

    render() {
        const cardElement = document.createElement('div'); // Создаем новый div элемент
        cardElement.className = 'card'; // Устанавливаем класс для стилей
        cardElement.innerText = this.name; // Устанавливаем текст внутри элемента
        return cardElement; // Возвращаем созданный элемент
    }
}

export class Card extends Selectable{
    render() {
        const cardElement = document.createElement('div'); // Создаем новый div элемент
        cardElement.className = 'card'; // Устанавливаем класс для стилей
        cardElement.innerText = this.name; // Устанавливаем текст внутри элемента
        return cardElement; // Возвращаем созданный элемент
    }
}

export class Queen extends Selectable {
    idQueen
    type
    value
    render() {
        const queenElement = super.render(); // Вызываем метод render родительского класса
        queenElement.classList.add('queen'); // Добавляем дополнительный класс для королевы
        return queenElement; // Возвращаем элемент
    }
}

export class Player extends HTMLElement {
    constructor(login) {
        super();
        this.login = login; // Имя игрока
        this.hand = []; // Карты на руке
        this.queens = []; // Королевы, которые игрок собрал
    }

    addCard(card) {
        this.hand.push(card); // Добавляем карту в руку
    }

    playCard(card) {
        const index = this.hand.indexOf(card);
        if (index > -1) {
            this.hand.splice(index, 1); // Удаляем карту из руки
        }
    }

    addQueen(queen) {
        this.queens.push(queen); // Добавляем королеву в коллекцию игрока
    }

    render() {
        const playerElement = document.createElement('div'); // Создаем элемент для игрока
        playerElement.className = 'player'; // Устанавливаем класс для стилей
        playerElement.innerText = this.name; // Устанавливаем имя игрока

        const handElement = document.createElement('div'); // Элемент для карт на руке
        handElement.className = 'hand'; // Устанавливаем класс для стилей
        this.hand.forEach(card => {
            handElement.appendChild(card.render()); // Добавляем карты в элемент руки
        });

        const queensElement = document.createElement('div'); // Элемент для королев
        queensElement.className = 'queens'; // Устанавливаем класс для стилей
        this.queens.forEach(queen => {
            queensElement.appendChild(queen.render()); // Добавляем королев в элемент
        });

        playerElement.appendChild(handElement); // Добавляем элемент руки к элементу игрока
        playerElement.appendChild(queensElement); // Добавляем элемент королев к элементу игрока
        return playerElement; // Возвращаем элемент игрока
    }
}

export class Game extends HTMLElement{
    constructor() {
        super();
        this.players = []; // Список игроков
        this.deck = this.createDeck(); // Создание колоды
        this.tableQueens = this.createTableQueens(); // Создание королев на столе
    }

    createDeck() {
        const deck = []; // Создание колоды карт
        // Добавьте карты в колоду (пример)
        return deck;
    }

    createTableQueens() {
        const queens = [];
        for (let i = 0; i < 12; i++) {
            queens.push(new Queen(`Королева ${i + 1}`)); // Создание 12 королев
        }
        return queens;
    }

    addPlayer(player) {
        this.players.push(player); // Добавление игрока в игру
    }

    render() {
        const gameElement = document.createElement('div'); // Создаем элемент для игры
        gameElement.className = 'game'; // Устанавливаем класс для стилей

        const tableElement = document.createElement('div'); // Элемент для стола
        tableElement.className = 'table'; // Устанавливаем класс для стилей
        this.tableQueens.forEach(queen => {
            tableElement.appendChild(queen.render()); // Добавляем королев на стол
        });

        const playersElement = document.createElement('div'); // Элемент для игроков
        playersElement.className = 'players'; // Устанавливаем класс для стилей
        this.players.forEach(player => {
            playersElement.appendChild(player.render()); // Добавляем игроков
        });

        gameElement.appendChild(tableElement); // Добавляем стол к элементу игры
        gameElement.appendChild(playersElement); // Добавляем игроков
        gameElement.appendChild(playersElement); // Добавляем игроков к элементу игры
        return gameElement; // Возвращаем элемент игры
    }
}
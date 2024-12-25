CREATE TYPE QUEEN_TYPE AS ENUM (
    'Королева Роз',
    'Королева Собак',
    'Королева Кошек',
    'Королева Подсолнухов',
    'Блинная Королева',
    'Королева Божьих Коровок',
    'Королева Морских Звёзд',
    'Королева Сердец',
    'Лунная Королева',
    'Королева Радуги',
    'Королева Тортов',
    'Королева Павлинов'
);
CREATE TYPE CARD_VALUE AS ENUM (
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'Король',
    'Рыцарь',
    'Сонное Зелье',
    'Дракон',
    'Волшебная Палочка'
);
CREATE TYPE STATUS AS ENUM ('WAIT', 'RUNNING', 'ENDED');

CREATE TABLE Users(
    login VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    last_play TIMESTAMP NULL,

    PRIMARY KEY (login)
);

CREATE TABLE Rooms(
    id_room SERIAL,
    turn_duration SMALLINT NOT NULL DEFAULT 30,
    status STATUS NOT NULL DEFAULT 'WAIT',
    invite_code VARCHAR(6) NULL,
    players SMALLINT NOT NULL DEFAULT 2,

    PRIMARY KEY (id_room)
);

CREATE TABLE Players(
    id_player SERIAL,
    id_room INT NOT NULL,
    login VARCHAR(30) NULL,

    PRIMARY KEY (id_player),
    FOREIGN KEY (id_room) REFERENCES Rooms(id_room)  ON DELETE CASCADE,
    FOREIGN KEY (login) REFERENCES Users(login) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Turns(
    id_player INT,
    begin_at TIMESTAMP NOT NULL,

    PRIMARY KEY (id_player),
    FOREIGN KEY (id_player) REFERENCES Players(id_player) ON DELETE CASCADE
 );

CREATE TABLE Cards(
    id_card SERIAL,
    value CARD_VALUE NOT NULL,

    PRIMARY KEY (id_card)
);

CREATE TABLE Attacks(
    id_init_player INT,
    id_target_player INT NOT NULL,
    id_card INT NOT NULL,

    PRIMARY KEY (id_init_player),
    UNIQUE (id_target_player),
    UNIQUE (id_card),
    FOREIGN KEY (id_init_player) REFERENCES Players(id_player) ON DELETE CASCADE,
    FOREIGN KEY (id_target_player) REFERENCES Players(id_player) ON DELETE CASCADE,
    FOREIGN KEY (id_card) REFERENCES Cards(id_card) ON DELETE CASCADE
);

CREATE TABLE Deck_cards(
    id_card INT,
    id_room INT NOT NULL,

    PRIMARY KEY (id_card),
    FOREIGN KEY (id_card) REFERENCES Cards(id_card) ON DELETE CASCADE,
    FOREIGN KEY (id_room) REFERENCES Rooms(id_room)  ON DELETE CASCADE
);

CREATE TABLE Player_cards(
    id_card INT,
    id_player INT NOT NULL,

    PRIMARY KEY (id_card),
    FOREIGN KEY (id_card) REFERENCES Cards(id_card) ON DELETE CASCADE,
    FOREIGN KEY (id_player) REFERENCES Players(id_player)  ON DELETE CASCADE
);

CREATE TABLE Queen_values(
    type QUEEN_TYPE,
    value SMALLINT NOT NULL,

    PRIMARY KEY (type)
);

CREATE TABLE Queens(
    id_queen SERIAL,
    type QUEEN_TYPE NOT NULL,

    PRIMARY KEY (id_queen),
    FOREIGN KEY (type) REFERENCES Queen_values(type)
);

CREATE TABLE Player_queens(
    id_queen INT,
    id_player INT NOT NULL,

    PRIMARY KEY (id_queen),
    FOREIGN KEY (id_queen) REFERENCES Queens(id_queen)  ON DELETE CASCADE,
    FOREIGN KEY (id_player) REFERENCES Players(id_player)  ON DELETE CASCADE
);





CREATE TABLE Tokens(
   login VARCHAR(30) not null ,
   token VARCHAR(255) NOT NULL,
   created TIMESTAMP not null DEFAULT current_timestamp,

   PRIMARY KEY (token),
   FOREIGN KEY (login) REFERENCES Users(login) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Used_cards(
   id_card INT,
   id_room INT NOT NULL,

   PRIMARY KEY (id_card),
   FOREIGN KEY (id_card) REFERENCES Cards(id_card) ON DELETE CASCADE,
   FOREIGN KEY (id_room) REFERENCES Rooms(id_room)  ON DELETE CASCADE
);

CREATE TABLE Table_queens(
    id_queen INT,
    id_room INT NOT NULL,
    position INT NOT NULL,

    PRIMARY KEY (id_queen),
    UNIQUE (id_room, position),
    FOREIGN KEY (id_queen) REFERENCES Queens(id_queen)  ON DELETE CASCADE,
    FOREIGN KEY (id_room) REFERENCES Rooms(id_room)  ON DELETE CASCADE
);

drop table Attacks;
CREATE TABLE Attacks(
    id_init_player INT,
    id_attack_card INT NOT NULL,
    id_target_queen INT NOT NULL,

    PRIMARY KEY (id_init_player),
    UNIQUE (id_target_queen),
    UNIQUE (id_attack_card),
    FOREIGN KEY (id_init_player) REFERENCES Players(id_player) ON DELETE CASCADE,
    FOREIGN KEY (id_attack_card) REFERENCES Cards(id_card) ON DELETE CASCADE,
    FOREIGN KEY (id_target_queen) REFERENCES Queens(id_queen) ON DELETE CASCADE
);
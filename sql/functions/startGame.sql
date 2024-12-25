create or replace procedure startGame(roomid integer)
    language plpgsql
    external security invoker
as $$
<<block>>
declare
    player1id integer = null;
    player2id integer = null;
    player3id integer = null;
    player4id integer = null;
    player5id integer = null;
begin
    if exists(select rooms.status from rooms where id_room=roomid and status='WAIT') then
        WITH insertedCards AS (
            INSERT INTO cards (value)
                SELECT CAST(val as card_value) FROM (VALUES ('1'),('1'),('1'),('1'),('2'),('2'),('2'),('2'),('3'),('3'),('3'),('3'),('4'),('4'),('4'),('4'),('5'),('5'),('5'),('5'),('6'),('6'),('6'),('6'),('7'),('7'),('7'),('7'),('8'),('8'),('8'),('8'),('9'),('9'),('9'),('9'),('10'),('10'),('10'),('10'),('Король'),('Король'),('Король'),('Король'),('Король'),('Король'),('Король'),('Король'),('Дракон'),('Дракон'),('Дракон'),('Волшебная Палочка'),('Волшебная Палочка'),('Волшебная Палочка'),('Сонное Зелье'),('Сонное Зелье'),('Сонное Зелье'),('Сонное Зелье'),('Рыцарь'),('Рыцарь'),('Рыцарь'),('Рыцарь')) AS temp(val)
                ORDER BY RANDOM()
                RETURNING id_card
        )
        INSERT INTO deck_cards (id_card, id_room) select insertedCards.id_card, roomid from insertedCards;

        WITH insertedQueens AS (
            INSERT INTO queens (type)
                SELECT CAST(val as queen_type) FROM (VALUES ('Королева Роз'), ('Королева Собак'), ('Королева Кошек'), ('Королева Подсолнухов'), ('Блинная Королева'), ('Королева Божьих Коровок'), ('Королева Морских Звёзд'), ('Королева Сердец'), ('Лунная Королева'), ('Королева Радуги'), ('Королева Тортов'), ('Королева Павлинов')) AS temp(val)
                ORDER BY RANDOM()
                RETURNING id_queen
        )
        INSERT INTO table_queens (id_queen, id_room, position) select insertedQueens.id_queen, roomid, row_number() over (order by random()) from insertedQueens;

        update rooms set status='RUNNING' where id_room=roomid;
        select id_player into player1id from players where id_room=roomid offset 0 limit 1;
        select id_player into player2id from players where id_room=roomid offset 1 limit 1;
        select id_player into player3id from players where id_room=roomid offset 2 limit 1;
        select id_player into player4id from players where id_room=roomid offset 3 limit 1;
        select id_player into player5id from players where id_room=roomid offset 4 limit 1;

        if (player1id is not null) then
            call getcardfromdeck(player1id);
            call getcardfromdeck(player1id);
            call getcardfromdeck(player1id);
            call getcardfromdeck(player1id);
            call getcardfromdeck(player1id);
        end if;
        if (player2id is not null) then
            call getcardfromdeck(player2id);
            call getcardfromdeck(player2id);
            call getcardfromdeck(player2id);
            call getcardfromdeck(player2id);
            call getcardfromdeck(player2id);
        end if;
        if (player3id is not null) then
            call getcardfromdeck(player3id);
            call getcardfromdeck(player3id);
            call getcardfromdeck(player3id);
            call getcardfromdeck(player3id);
            call getcardfromdeck(player3id);
        end if;
        if (player4id is not null) then
            call getcardfromdeck(player4id);
            call getcardfromdeck(player4id);
            call getcardfromdeck(player4id);
            call getcardfromdeck(player4id);
            call getcardfromdeck(player4id);
        end if;
        if (player5id is not null) then
            call getcardfromdeck(player5id);
            call getcardfromdeck(player5id);
            call getcardfromdeck(player5id);
            call getcardfromdeck(player5id);
            call getcardfromdeck(player5id);

        end if;
        insert into turns(id_player, begin_at) values (player1id, now() at time zone 'UTC');
    else
        RAISE debug 'waiting room not found';
    end if;
end;
$$;

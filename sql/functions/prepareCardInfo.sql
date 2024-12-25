create or replace function prepareCardInfo(cardId integer)
    returns json
    language plpgsql
    external security invoker
as $$
<<block>>
DECLARE
    cvalue card_value;
begin
    if cardId is null then
        return null;
    end if;
    select c.value into cvalue from cards c where id_card=cardId;
    return json_build_object(
        'id_card', cardId,
        'value', cvalue
    );
end;
$$;

create or replace function prepareQueenInfo(queenId integer)
    returns json
    language plpgsql
    external security invoker
as $$
<<block>>
DECLARE
    qtype queen_type;
    qvalue integer;
begin
    if queenId is null then
        return null;
    end if;
    select q.type into qtype from queens q where id_queen=queenId;
    select cast(qv.value as smallint) into qvalue from queen_values qv where qv.type=qtype;
    return json_build_object(
        'id_queen', queenId,
        'type', qtype,
        'value', qvalue
    );
end;
$$;

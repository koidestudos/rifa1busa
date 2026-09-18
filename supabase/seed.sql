-- Seed dos 435 números.
-- Execute DEPOIS de criar os 29 alunos com: npm run seed
-- (o script de seed já insere os números; este arquivo é o equivalente SQL)

insert into public.numeros (numero, aluno_id)
select g.numero, p.id
from public.profiles p
join (
  values
    ('ana.leticia.matos', 1, 15),
    ('ana.leticia.reis', 16, 30),
    ('ariadnny', 31, 45),
    ('arthur.guilherme', 46, 60),
    ('dara.julia', 61, 75),
    ('davi.liev', 76, 90),
    ('edmilson', 91, 105),
    ('euller.pedro', 106, 120),
    ('guilherme', 121, 135),
    ('gustavo.maximus', 136, 150),
    ('joao.artur', 151, 165),
    ('joao.hellio', 166, 180),
    ('jorge', 181, 195),
    ('jullya.isabelly', 196, 210),
    ('kauã.miranda', 211, 225),
    ('luiz.gustavo', 226, 240),
    ('maria.clara', 241, 255),
    ('maria.eduarda', 256, 270),
    ('maria.heloa', 271, 285),
    ('marinalva', 286, 300),
    ('maysa', 301, 315),
    ('mikael', 316, 330),
    ('sabrina', 331, 345),
    ('samira', 346, 360),
    ('sophia', 361, 375),
    ('thomas', 376, 390),
    ('yago', 391, 405),
    ('yan.kalebe', 406, 420),
    ('jorge.menor', 421, 435)
) as ranges(login, start_n, end_n)
  on p.login = ranges.login
cross join lateral generate_series(ranges.start_n, ranges.end_n) as g(numero)
on conflict (numero) do nothing;

-- Conferências
do $$
declare
  v_profiles integer;
  v_numeros integer;
  v_por_aluno integer;
  v_super integer;
begin
  select count(*) into v_profiles from public.profiles;
  select count(*) into v_numeros from public.numeros;
  select count(*) into v_super from public.profiles where role = 'super_admin' and login = 'euller.pedro';

  if v_numeros <> 435 then
    raise exception 'Esperado 435 números, encontrado %', v_numeros;
  end if;

  select count(*) into v_por_aluno
  from (
    select aluno_id
    from public.numeros
    group by aluno_id
    having count(*) <> 15
  ) t;

  if v_por_aluno <> 0 then
    raise exception 'Existem alunos sem exatamente 15 números';
  end if;

  if v_super <> 1 then
    raise exception 'Euller Pedro precisa ser o SUPER ADMIN inicial';
  end if;

  raise notice 'Seed OK: % alunos, % números', v_profiles, v_numeros;
end;
$$;

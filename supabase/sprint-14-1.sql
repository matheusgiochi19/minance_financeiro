alter table public.cartao_despesas
add column if not exists status_pagamento text not null default 'aberto';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cartao_despesas_status_pagamento_check'
  ) then
    alter table public.cartao_despesas
    add constraint cartao_despesas_status_pagamento_check
    check (status_pagamento in ('aberto', 'parcial', 'pago'));
  end if;
end;
$$;

update public.cartao_despesas
set status_pagamento = case
  when status = 'pp' then 'pago'
  when status = 'p' then 'parcial'
  else 'aberto'
end
where status_pagamento is null
   or status_pagamento not in ('aberto', 'parcial', 'pago');

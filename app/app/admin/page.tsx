import { redirect } from "next/navigation";
import { deleteUser, toggleUserActive, updateUserRole } from "@/app/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isMaster, type Profile } from "@/lib/profiles";

export default async function AdminPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!isMaster(profile)) {
    redirect("/app/dashboard");
  }

  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id,user_id,email,role,ativo,created_at,updated_at")
    .order("created_at", { ascending: true })
    .returns<Profile[]>();

  return (
    <section className="admin-page">
      <div className="page-heading">
        <p>Administração</p>
        <h1>Usuários</h1>
        <span>Controle acesso, bloqueios e roles do Minance.</span>
      </div>

      {error ? <p className="admin-alert">Não foi possível carregar usuários: {error.message}</p> : null}

      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>E-mail</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Criado em</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(users || []).map((item) => {
              const isSelf = item.user_id === user.id;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <strong>{item.email}</strong>
                    {isSelf ? <span className="self-badge">Você</span> : null}
                  </TableCell>
                  <TableCell>
                    <form action={updateUserRole}>
                      <input name="user_id" type="hidden" value={item.user_id} />
                      <select aria-label={`Role de ${item.email}`} defaultValue={item.role} name="role">
                        <option value="user">user</option>
                        <option value="master">master</option>
                      </select>
                      <Button size="sm" type="submit">Salvar</Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    <span className={`status-pill ${item.ativo ? "active" : "blocked"}`}>{item.ativo ? "Ativo" : "Bloqueado"}</span>
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(item.created_at))}</TableCell>
                  <TableCell>
                    <div className="table-actions">
                      <form action={toggleUserActive}>
                        <input name="user_id" type="hidden" value={item.user_id} />
                        <input name="ativo" type="hidden" value={String(!item.ativo)} />
                        <Button disabled={isSelf} size="sm" type="submit">
                          {item.ativo ? "Bloquear" : "Ativar"}
                        </Button>
                      </form>
                      <form action={deleteUser}>
                        <input name="user_id" type="hidden" value={item.user_id} />
                        <Button disabled={isSelf} size="sm" type="submit" variant="danger">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
    </section>
  );
}

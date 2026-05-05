import { redirect } from "next/navigation";
import { deleteUser, toggleUserActive, updateUserRole } from "@/app/app/admin/actions";
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
        <p>Administracao</p>
        <h1>Usuarios</h1>
        <span>Controle acesso, bloqueios e roles do Minance.</span>
      </div>

      {error ? <p className="admin-alert">Nao foi possivel carregar usuarios: {error.message}</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Role</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {(users || []).map((item) => {
              const isSelf = item.user_id === user.id;
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.email}</strong>
                    {isSelf ? <span className="self-badge">Voce</span> : null}
                  </td>
                  <td>
                    <form action={updateUserRole}>
                      <input name="user_id" type="hidden" value={item.user_id} />
                      <select aria-label={`Role de ${item.email}`} defaultValue={item.role} name="role">
                        <option value="user">user</option>
                        <option value="master">master</option>
                      </select>
                      <button className="table-button" type="submit">Salvar</button>
                    </form>
                  </td>
                  <td>
                    <span className={`status-pill ${item.ativo ? "active" : "blocked"}`}>{item.ativo ? "Ativo" : "Bloqueado"}</span>
                  </td>
                  <td>{new Intl.DateTimeFormat("pt-BR").format(new Date(item.created_at))}</td>
                  <td>
                    <div className="table-actions">
                      <form action={toggleUserActive}>
                        <input name="user_id" type="hidden" value={item.user_id} />
                        <input name="ativo" type="hidden" value={String(!item.ativo)} />
                        <button className="table-button" disabled={isSelf} type="submit">
                          {item.ativo ? "Bloquear" : "Ativar"}
                        </button>
                      </form>
                      <form action={deleteUser}>
                        <input name="user_id" type="hidden" value={item.user_id} />
                        <button className="danger-button" disabled={isSelf} type="submit">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

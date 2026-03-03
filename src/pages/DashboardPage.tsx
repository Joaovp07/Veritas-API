import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <section className="card">
      <h1>Perfil do Usuário</h1>
      <div className="profile">
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Nome:</strong> {user?.name}</p>
        <p><strong>E-mail:</strong> {user?.email}</p>
      </div>
      <button onClick={logout} className="secondary">Logout</button>
    </section>
  );
}

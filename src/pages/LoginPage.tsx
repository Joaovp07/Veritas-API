import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSubmitting(true);
    const loginError = await login({ email: email.trim(), password });
    setSubmitting(false);

    if (loginError) {
      setError(loginError);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <section className="card">
      <h1>Login</h1>
      <form onSubmit={onSubmit} className="form">
        <label>E-mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" />

        <label>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />

        {error && <p className="error">{error}</p>}

        <button disabled={submitting} type="submit">
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p>
        Não tem conta? <Link to="/register">Cadastre-se</Link>
      </p>
    </section>
  );
}

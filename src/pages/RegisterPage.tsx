import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Preencha todos os campos obrigatórios.");
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
    const registerError = await register({ name: name.trim(), email: email.trim(), password });
    setSubmitting(false);

    if (registerError) {
      setError(registerError);
      return;
    }

    navigate("/login");
  };

  return (
    <section className="card">
      <h1>Cadastro</h1>
      <form onSubmit={onSubmit} className="form">
        <label>Nome</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />

        <label>E-mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" />

        <label>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />

        {error && <p className="error">{error}</p>}

        <button disabled={submitting} type="submit">
          {submitting ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Faça login</Link>
      </p>
    </section>
  );
}

import React from "react";
import { ContainerScroll } from "./components/ui/container-scroll-animation";
import { motion } from "motion/react";
import { NavBarDemo } from "./components/ui/navbar-demo";
import DisplayCards from "@/src/components/ui/display-cards";
import { Shield, AlertTriangle, Lock, Database } from "lucide-react";

export default function App() {
  const featureCards = [
    {
      icon: <Shield className="size-6" />,
      title: "Validação de Formulários",
      description: "Schema validation rigoroso para garantir integridade dos dados enviados.",
      date: "Validação segura",
      titleClassName: "text-emerald-400",
    },
    {
      icon: <AlertTriangle className="size-6" />,
      title: "Tratamento de Erros",
      description: "Respostas padronizadas e descritivas para facilitar o debug.",
      date: "Logs estruturados",
      titleClassName: "text-emerald-400",
    },
    {
      icon: <Lock className="size-6" />,
      title: "Controle de Acesso",
      description: "Autenticação JWT e permissões granulares.",
      date: "RBAC",
      titleClassName: "text-emerald-400",
    },
    {
      icon: <Database className="size-6" />,
      title: "Segurança de Dados",
      description: "Proteção contra injeção e sanitização automática.",
      date: "Proteção ativa",
      titleClassName: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      <NavBarDemo />

      <main>
        {/* Hero with Scroll Animation */}
        <section className="flex flex-col overflow-hidden">
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl md:text-7xl font-bold text-white mb-4">
                  Veritas API <br />
                  <span className="text-emerald-500 text-3xl md:text-5xl">
                    Validação e Autenticação Segura
                  </span>
                </h1>
                <p className="text-zinc-400 max-w-2xl mx-auto text-lg md:text-xl mb-8">
                  A solução definitiva para validação de dados rigorosa e autenticação segura em suas aplicações modernas.
                </p>
              </>
            }
          >
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c"
              alt="Veritas API Dashboard"
              className="mx-auto rounded-2xl object-cover h-full object-left-top"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </ContainerScroll>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">Sobre o Projeto</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            A Veritas API foi desenvolvida para garantir que a comunicação entre sistemas seja confiável e protegida. 
            Focada em <strong className="text-white">validação de dados</strong> de alta precisão e <strong className="text-white">autenticação segura</strong>, 
            nossa arquitetura REST permite que você foque no desenvolvimento do seu core business sem se preocupar com vulnerabilidades de entrada ou acesso não autorizado.
          </p>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-24 bg-black overflow-hidden">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-white tracking-tight">
              Funcionalidades
            </h2>

            <div className="flex justify-center">
              <DisplayCards cards={featureCards} />
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center tracking-tight">Como Funciona</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-emerald-500/20 hidden md:block"></div>
            <div className="space-y-12">
              <Step number="01" title="Front-end" description="Envio da requisição com payload estruturado." />
              <Step number="02" title="API Gateway" description="Recebimento e verificação instantânea de autenticação." />
              <Step number="03" title="Validação" description="Aplicação das regras de negócio e sanitização profunda." />
              <Step number="04" title="Processamento" description="Execução segura da lógica de backend em ambiente isolado." />
              <Step number="05" title="Resposta" description="Retorno dos dados processados ou erros tratados com clareza." />
            </div>
          </div>
        </section>

        {/* Technologies */}
        <section id="technologies" className="py-24 px-6 text-center border-t border-white/5">
          <h2 className="text-2xl font-bold mb-4">Tecnologias</h2>
          <div className="flex flex-wrap justify-center gap-4 text-zinc-500 font-mono text-sm">
            <span>TypeScript</span>
            <span>•</span>
            <span>Node.js</span>
            <span>•</span>
            <span>Express</span>
            <span>•</span>
            <span>JWT</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Framer Motion</span>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 text-center text-zinc-500 text-sm">
        <p>&copy; 2026 Veritas API. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-8 items-start relative">
      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xl shrink-0 z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
        {number}
      </div>
      <div className="pt-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

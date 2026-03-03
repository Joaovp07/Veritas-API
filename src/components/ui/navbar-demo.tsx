import { Home, Info, Zap, Mail } from 'lucide-react'
import { NavBar } from "@/src/components/ui/tubelight-navbar"

export function NavBarDemo() {
  const navItems = [
    { name: 'Início', url: '#', icon: Home },
    { name: 'Sobre', url: '#about', icon: Info },
    { name: 'Funcionalidades', url: '#features', icon: Zap },
    { name: 'Como Funciona', url: '#how-it-works', icon: Mail }
  ]

  return <NavBar items={navItems} />
}

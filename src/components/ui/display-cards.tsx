"use client";
import React from "react";

import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  key?: React.Key;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-emerald-500" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-emerald-500",
  titleClassName = "text-emerald-500",
}: DisplayCardProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        y: -20,
        x: 2 // Slightly decreased x offset
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      className={cn(
        "group relative flex flex-col justify-between h-48 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-6 shadow-lg transform-gpu hover:shadow-2xl hover:border-emerald-500/50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900/50 border border-zinc-700 group-hover:border-emerald-500/30 transition-colors", iconClassName)}>
          {icon}
        </div>
        <h3 className={cn("text-lg font-semibold tracking-tight text-white", titleClassName)}>
          {title}
        </h3>
      </div>
      
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      
      <div className="mt-6 flex items-center justify-between border-t border-zinc-700/50 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {date}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  if (!cards) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
      {cards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}

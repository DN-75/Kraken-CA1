"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { IoSearchOutline } from "react-icons/io5";

export default function HeroSearch() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();

    if (!query) {
      router.push("/browse");
      return;
    }

    router.push(`/browse?search=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={handleHeroSearch}
      className="flex max-sm:flex-wrap items-center bg-white/[0.08] border border-white/10 rounded-full max-sm:rounded-2xl py-1.5 pl-6 pr-1.5 max-sm:p-3 max-sm:px-4 max-w-[520px] mx-auto mb-6 gap-3 max-sm:gap-2.5 backdrop-blur-[10px]"
    >
      <IoSearchOutline size={20} className="text-white/50 shrink-0 max-sm:hidden" />
      <input
        type="text"
        placeholder="Search By Skill, Industry or Role"
        value={heroSearch}
        onChange={(e) => setHeroSearch(e.target.value)}
        className="flex-1 max-sm:w-full max-sm:min-w-0 bg-transparent border-none outline-none text-white text-sm font-[inherit] placeholder:text-white/45"
      />
      <button
        type="submit"
        className="bg-[var(--emerald-primary)] hover:bg-[#0ea371] text-white border-none py-2.5 px-6 max-sm:w-full max-sm:text-center max-sm:py-3 max-sm:px-5 rounded-full text-[0.85rem] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-200"
      >
        Find an Expert
      </button>
    </form>
  );
}

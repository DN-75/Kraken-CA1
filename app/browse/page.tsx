"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IoSearchOutline, IoStar, IoCheckmarkCircle } from "react-icons/io5";
import { useCachedProfessionals } from "@/hooks/useProfessionalsContext";

const FILTER_SKILLS = [
	"UI/UX Design",
	"Web Development",
	"Digital Marketing",
	"Business Strategy",
	"Data Science",
	"DevOps",
	"Machine Learning",
	"Cloud Computing",
	"Other",
];

type SortOption = "top-rated" | "lowest-price" | "newest";

function toCurrency(value: number) {
	return `$${Math.round(value)}`;
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export default function BrowsePage() {
	const { professionals, loading, error } = useCachedProfessionals();
	const searchParams = useSearchParams();

	const [search, setSearch] = useState("");
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
	const [priceCap, setPriceCap] = useState(500);
	const [priceInitialized, setPriceInitialized] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("top-rated");
	const querySearch = searchParams.get("search")?.trim() ?? "";

	const mappedCategorySkill = useMemo(() => {
		const category = searchParams.get("category")?.trim();
		if (!category) return "";

		const categoryMap: Record<string, string> = {
			"web developers": "Web Development",
			"career coaches": "Business Strategy",
			"software engineers": "Web Development",
			"data scientist": "Data Science",
			marketing: "Digital Marketing",
		};

		return categoryMap[category.toLowerCase()] ?? category;
	}, [searchParams]);

	const maxAvailablePrice = useMemo(() => {
		if (!professionals.length) return 500;
		const highest = Math.max(...professionals.map((p) => p.price_per_hour || 0));
		return Math.max(500, Math.ceil(highest / 10) * 10);
	}, [professionals]);

	const visibleSkills = useMemo(() => {
		const fromDb = new Set<string>();

		professionals.forEach((pro) => {
			pro.skill_labels.forEach((label) => {
				if (label?.trim()) fromDb.add(label.trim());
			});
		});

		return [...new Set([...FILTER_SKILLS, ...Array.from(fromDb)])];
	}, [professionals]);

	const filteredProfessionals = useMemo(() => {
		const query = search.trim().toLowerCase();

		const filtered = professionals.filter((pro) => {
			const name = pro.profiles?.name?.toLowerCase() ?? "";
			const title = pro.job_title?.toLowerCase() ?? "";
			const company = pro.job?.toLowerCase() ?? "";
			const skills = pro.skill_labels.map((s) => s.toLowerCase());

			const textMatched =
				!query ||
				name.includes(query) ||
				title.includes(query) ||
				company.includes(query) ||
				skills.some((skill) => skill.includes(query));

			const skillMatched =
				selectedSkills.length === 0 ||
				selectedSkills.some((skill) =>
					pro.skill_labels.some((label) =>
						label.toLowerCase().includes(skill.toLowerCase())
					)
				);

			const priceMatched = (pro.price_per_hour || 0) <= priceCap;

			return textMatched && skillMatched && priceMatched;
		});

		filtered.sort((a, b) => {
			if (sortBy === "lowest-price") {
				return (a.price_per_hour || 0) - (b.price_per_hour || 0);
			}

			if (sortBy === "newest") {
				return (
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				);
			}

			if (b.avg_rating !== a.avg_rating) {
				return b.avg_rating - a.avg_rating;
			}

			return b.review_count - a.review_count;
		});

		return filtered;
	}, [professionals, search, selectedSkills, priceCap, sortBy]);

	useEffect(() => {
		if (priceInitialized || loading) return;
		setPriceCap(maxAvailablePrice);
		setPriceInitialized(true);
	}, [maxAvailablePrice, loading, priceInitialized]);

	useEffect(() => {
		if (!mappedCategorySkill) return;

		setSelectedSkills((prev) => {
			if (prev.some((skill) => skill.toLowerCase() === mappedCategorySkill.toLowerCase())) {
				return prev;
			}
			return [...prev, mappedCategorySkill];
		});
	}, [mappedCategorySkill]);

	useEffect(() => {
		setSearch(querySearch);
	}, [querySearch]);

	const clearAllFilters = () => {
		setSearch("");
		setSelectedSkills([]);
		setSortBy("top-rated");
		setPriceCap(maxAvailablePrice);
	};

	const toggleSkill = (skill: string) => {
		setSelectedSkills((prev) =>
			prev.includes(skill)
				? prev.filter((item) => item !== skill)
				: [...prev, skill]
		);
	};

	if (loading) {
		return (
			<main className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center text-white/70">
					Loading mentors...
				</div>
			</main>
		);
	}

	if (error) {
		return (
			<main className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
					Failed to load mentors: {error}
				</div>
			</main>
		);
	}

	return (
		<main className="px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
				<aside className="h-fit rounded-2xl border border-[var(--card-border)] bg-[rgba(2,44,34,0.72)] p-5 backdrop-blur-xl lg:sticky lg:top-20">
					<p className="mb-4 text-xs font-semibold uppercase tracking-[1.3px] text-white/50">
						Filters
					</p>

					<div className="mb-6">
						<p className="mb-2 text-sm font-semibold text-white/85">Skills</p>
						<div className="max-h-64 space-y-2 overflow-auto pr-1">
							{visibleSkills.map((skill) => {
								const selected = selectedSkills.includes(skill);

								return (
									<label
										key={skill}
										className="flex cursor-pointer items-center gap-2.5 text-sm text-white/70"
									>
										<input
											type="checkbox"
											checked={selected}
											onChange={() => toggleSkill(skill)}
											className="h-4 w-4 cursor-pointer accent-[var(--emerald-primary)]"
										/>
										<span className={selected ? "text-white" : "text-white/70"}>
											{skill}
										</span>
									</label>
								);
							})}
						</div>
					</div>

					<div className="mb-6">
						<p className="mb-2 text-sm font-semibold text-white/85">Price Range</p>
						<div className="mb-2 flex items-center justify-between text-xs text-white/50">
							<span>$0</span>
							<span>{toCurrency(priceCap)}</span>
						</div>
						<input
							type="range"
							min={0}
							max={maxAvailablePrice}
							value={priceCap}
							onChange={(e) => setPriceCap(Number(e.target.value))}
							className="h-2 w-full cursor-pointer accent-[var(--emerald-primary)]"
						/>
					</div>

					<div className="mb-6">
						<p className="mb-2 text-sm font-semibold text-white/85">Sort By</p>
						<div className="space-y-2 text-sm text-white/70">
							<label className="flex cursor-pointer items-center gap-2.5">
								<input
									type="radio"
									checked={sortBy === "top-rated"}
									onChange={() => setSortBy("top-rated")}
									name="sortOption"
									className="h-4 w-4 cursor-pointer accent-[var(--emerald-primary)]"
								/>
								Top Rated
							</label>
							<label className="flex cursor-pointer items-center gap-2.5">
								<input
									type="radio"
									checked={sortBy === "lowest-price"}
									onChange={() => setSortBy("lowest-price")}
									name="sortOption"
									className="h-4 w-4 cursor-pointer accent-[var(--emerald-primary)]"
								/>
								Lowest Price
							</label>
							<label className="flex cursor-pointer items-center gap-2.5">
								<input
									type="radio"
									checked={sortBy === "newest"}
									onChange={() => setSortBy("newest")}
									name="sortOption"
									className="h-4 w-4 cursor-pointer accent-[var(--emerald-primary)]"
								/>
								Newest
							</label>
						</div>
					</div>

					<button
						onClick={clearAllFilters}
						className="w-full cursor-pointer rounded-xl border border-[var(--card-border)] bg-[rgba(16,185,129,0.1)] py-2.5 text-sm font-semibold text-white transition hover:bg-[rgba(16,185,129,0.2)]"
					>
						Clear All Filters
					</button>
				</aside>

				<section>
					<div className="mb-5">
						<div className="flex items-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[rgba(6,60,40,0.55)] px-4 py-3 backdrop-blur-xl">
							<IoSearchOutline className="text-white/40" size={18} />
							<input
								id="mentor-search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search members by name, role, company or skill"
								className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
							/>
						</div>
						<p className="mt-2 text-sm text-white/60">
							{filteredProfessionals.length} mentor
							{filteredProfessionals.length === 1 ? "" : "s"} found
						</p>
					</div>

					{filteredProfessionals.length === 0 ? (
						<div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center text-white/65">
							No mentors matched these filters.
						</div>
					) : (
						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
							{filteredProfessionals.map((mentor) => (
								<article
									key={mentor.id}
									className="flex h-full flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
								>
									<div className="mb-4 flex items-start justify-between gap-3">
										<div className="relative">
											{mentor.profiles?.profile_photo ? (
												<img
													src={mentor.profiles.profile_photo}
													alt={mentor.profiles.name}
													className="h-14 w-14 rounded-full border-2 border-emerald-400/70 object-cover"
												/>
											) : (
												<div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/60 bg-emerald-500/20 text-sm font-bold text-white">
													{getInitials(mentor.profiles?.name ?? "Mentor")}
												</div>
											)}
											<span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#024432] bg-[var(--emerald-primary)] text-[10px] text-white">
												<IoCheckmarkCircle size={12} />
											</span>
										</div>

										<div className="text-right">
											<p className="text-2xl font-bold leading-none text-white">
												Rs.{mentor.price_per_hour}
												<span className="text-xs font-medium text-white/45">/hr</span>
											</p>
											<p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300">
												<IoStar size={12} className="text-emerald-300" />
												{mentor.avg_rating > 0 ? mentor.avg_rating.toFixed(1) : "New"}
												<span className="text-white/40">({mentor.review_count})</span>
											</p>
										</div>
									</div>

									<div className="flex-1">
										<h2 className="text-xl font-normal text-white">
											{mentor.profiles?.name || "Unnamed Mentor"}
										</h2>
										<p className="mt-1 text-sm text-[#E2E2E0]">
											{mentor.job_title || mentor.field}
											{mentor.job ? ` @ ${mentor.job}` : ""}
										</p>

										<div className="mt-4 flex flex-wrap gap-2">
											{mentor.skill_labels.slice(0, 3).map((skill) => (
												<span
													key={`${mentor.id}-${skill}`}
													className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
												>
													{skill}
												</span>
											))}
											{mentor.skill_labels.length === 0 && (
												<span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
													General
												</span>
											)}
										</div>
									</div>

									<Link
										href={`/professional/${mentor.id}`}
										className="mt-5 block rounded-xl border border-emerald-500/25 bg-[rgba(16,185,129,0.08)] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[rgba(16,185,129,0.18)]"
									>
										Profile
									</Link>
								</article>
							))}
						</div>
					)}
				</section>
			</div>
		</main>
	);
}

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  IoSearchOutline,
  IoShieldCheckmarkOutline,
  IoCardOutline,
  IoVideocamOutline,
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoRocketOutline,
  IoPeopleOutline,
} from "react-icons/io5";

/* ── Data ─────────────────────────────────────────────── */
const CATEGORIES = [
  "Product Manager",
  "Career Coaches",
  "Software Engineers",
  "Data Scientist",
  "Marketing",
];

const FEATURES = [
  {
    icon: <IoShieldCheckmarkOutline size={22} />,
    title: "Verified Experts",
    desc: "Every Mentor is Automatically & Manually vetted for their expertise and experience. We ensure top-tier guidance from industry leaders.",
  },
  {
    icon: <IoCardOutline size={22} />,
    title: "Secure Payments",
    desc: "Every Mentor is Automatically & Manually vetted for their expertise and experience. We ensure top-tier guidance from industry leaders.",
  },
  {
    icon: <IoVideocamOutline size={22} />,
    title: "Video Consultations",
    desc: "Every Mentor is Automatically & Manually vetted for their expertise and experience. We ensure top-tier guidance from industry leaders.",
  },
];

const MENTORS = [
  {
    name: "Ashinthya",
    surname: "Jayakody",
    role: "CEO at the Almighty Cafe",
    rating: 4.9,
    sessions: 250,
    price: 150,
    image: "/images/mentor-1.png",
  },
  {
    name: "Ashinthya",
    surname: "Jayakody",
    role: "CEO at the Almighty Cafe",
    rating: 4.9,
    sessions: 250,
    price: 150,
    image: "/images/mentor-2.png",
  },
  {
    name: "Ashinthya",
    surname: "Jayakody",
    role: "CEO at the Almighty Cafe",
    rating: 4.9,
    sessions: 250,
    price: 150,
    image: "/images/mentor-3.png",
  },
];

const ABOUT_HIGHLIGHTS = [
  {
    icon: <IoShieldCheckmarkOutline size={20} />,
    title: "Verified Mentors",
    desc: "Handpicked experts from top industries, rigorously vetted for quality.",
  },
  {
    icon: <IoVideocamOutline size={20} />,
    title: "1-on-1 Sessions",
    desc: "Fast booking for private video consultations tailored to you.",
  },
  {
    icon: <IoRocketOutline size={20} />,
    title: "Career Growth",
    desc: "Guidance matched to your goals, career stage, and ambitions.",
  },
];

const CONTACT_ITEMS = [
  {
    icon: <IoMailOutline size={18} />,
    label: "Email",
    value: "support@expertconnect.com",
  },
  {
    icon: <IoCallOutline size={18} />,
    label: "Phone",
    value: "+94 77 123 4567",
  },
  {
    icon: <IoLocationOutline size={18} />,
    label: "Location",
    value: "Colombo, Sri Lanka",
  },
];

/* ── Page ─────────────────────────────────────────────── */
export default function Home() {
  return (
    <main>
      {/* ═══ Hero ═══════════════════════════════════════ */}
      <section className="hero-section" >

        <div
            className="hero-bg"
            style={{
              backgroundImage: "url(/images/hero-bg4.png)",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
        />

        <div className="hero-content">
          <h1 className="hero-title">
            1-on-1 Experts Guidance
            <br/>
            for Your <span>Growth</span>
          </h1>

          <p className="hero-subtitle">
            Get personalized advice from verified professionals in top
            industries. Accelerate your career with direct mentorship and
            actionable insights.
          </p>

          {/* Search bar */}
          <div className="search-bar">
            <IoSearchOutline size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search By Skill, Industry or Role"
            />
            <button className="search-btn">Find an Expert</button>
          </div>

          {/* Category tags */}
          <div className="category-tags">
            {CATEGORIES.map((cat) => (
              <span key={cat} className="category-tag">
                <IoPersonOutline size={14} />
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Why Choose ═════════════════════════════════ */}
      <section className="section">
        <p className="section-title">Why Choose</p>
        <h2 className="section-heading">
          Expert<span>Connect</span> ?
        </h2>
        <p className="section-desc">
          Get personalized advice from verified professionals in top industries.
          Accelerate your career with direct mentorship and actionable insights.
        </p>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Top Rated Mentors ══════════════════════════ */}
      <section className="mentors-section">
        <div className="mentors-section-header" style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2>Meet Top Rated Mentors</h2>
          <p>Book a session with mighty Ashinthya Jayakody today</p>
        </div>

        <div className="mentors-grid">
          {MENTORS.map((m, i) => (
            <div key={i} className="mentor-card">
              <Image
                src={m.image}
                alt={`${m.name} ${m.surname}`}
                width={400}
                height={200}
                className="mentor-card-image"
              />
              <div className="mentor-card-body">
                <p className="mentor-name">
                  {m.name} <span>{m.surname}</span>
                </p>
                <p className="mentor-role">{m.role}</p>
                <p className="mentor-stars">
                  <span>★</span> Stars {m.rating} ({m.sessions} sessions)
                </p>
              </div>
              <div className="mentor-card-footer">
                <span className="mentor-price">
                  ${m.price}/<span>hr</span>
                </span>
                <Link href={`/mentor/${i + 1}`} className="view-profile-btn">
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ About Us ════════════════════════════════════ */}
      <section id="about" className="about-section">
        <div className="about-top">
          <p className="section-title">Who We Are</p>
          <h2 className="section-heading">
            About <span>Us</span>
          </h2>
          <p className="about-tagline">
            Bridging ambition with expertise — one conversation at a time.
          </p>
        </div>

        <div className="about-bento">
          {/* Mission card - large */}
          <div className="about-bento-mission">
            <div className="about-mission-glow" />
            <span className="about-mission-badge">
              <IoPeopleOutline size={14} /> Our Mission
            </span>
            <p className="about-mission-text">
              ExpertConnect was built to democratize mentorship. We connect
              ambitious individuals with verified, world-class professionals
              for personalized one-on-one guidance that accelerates careers
              and transforms potential into achievement.
            </p>
          </div>

          {/* Highlight cards */}
          {ABOUT_HIGHLIGHTS.map((item) => (
            <div key={item.title} className="about-bento-card">
              <span className="about-bento-icon">{item.icon}</span>
              <h3 className="about-bento-title">{item.title}</h3>
              <p className="about-bento-desc">{item.desc}</p>
            </div>
          ))}

          {/* Stats strip */}
          <div className="about-bento-stats">
            <div className="about-stat">
              <span className="about-stat-number">500+</span>
              <span className="about-stat-label">Verified Experts</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat">
              <span className="about-stat-number">10K+</span>
              <span className="about-stat-label">Sessions</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat">
              <span className="about-stat-number">4.9</span>
              <span className="about-stat-label">Avg Rating</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat">
              <span className="about-stat-number">98%</span>
              <span className="about-stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Contact Us ══════════════════════════════════ */}
      <section id="contact" className="contact-section">
        <div className="contact-card">
          <div className="contact-card-glow" />
          <div className="contact-header">
            <p className="section-title">Get In Touch</p>
            <h2 className="section-heading">
              Contact <span>Us</span>
            </h2>
            <p className="contact-desc">
              Have questions or feedback? Reach out and our team will respond
              within 24 hours.
            </p>
          </div>
          <div className="contact-info-row">
            {CONTACT_ITEMS.map((item) => (
              <div key={item.label} className="contact-item">
                <span className="contact-item-icon">{item.icon}</span>
                <div>
                  <p className="contact-item-label">{item.label}</p>
                  <p className="contact-item-value">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="contact-form-compact" onSubmit={(e) => e.preventDefault()}>
            <div className="contact-form-row">
              <input type="text" placeholder="Your Name" className="contact-input" />
              <input type="email" placeholder="Your Email" className="contact-input" />
            </div>
            <input type="text" placeholder="Subject" className="contact-input" />
            <textarea
              placeholder="Your Message"
              rows={3}
              className="contact-input contact-textarea"
            />
            <button type="submit" className="contact-submit-btn">
              Send Message
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}

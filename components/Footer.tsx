import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>
            Expert<span>Connect</span>
          </h3>
          <p>Connecting Ambitious people with world class experts</p>
        </div>

        <div className="footer-links">
          <Link href="/about">About Us</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Term and Conditions</Link>
          <Link href="/contact">Contact Us</Link>
        </div>
      </div>

      <p className="footer-copyright">
        2026 Expert Connect all right reserved
      </p>
    </footer>
  );
}

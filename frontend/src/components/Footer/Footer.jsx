import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <h2 className="footer-logo">Tomato<span>.</span></h2>
          <p>
            Choose from a diverse menu featuring a delectable array of dishes. Our mission is to 
            satisfy your cravings and elevate your dining experience, one delicious meal at a time.
          </p>
          <div className="footer-social-icons">
            <a href="#" className="social-icon" aria-label="Facebook">
              <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="Twitter">
              <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M23.95 4.57a10 10 0 01-2.82.77 4.96 4.96 0 002.16-2.72 9.9 9.9 0 01-3.13 1.2 4.93 4.93 0 00-8.39 4.49A14 14 0 011.64 3.16a4.93 4.93 0 001.52 6.57 4.9 4.9 0 01-2.23-.62v.06a4.93 4.93 0 003.95 4.83 4.9 4.9 0 01-2.22.08 4.93 4.93 0 004.6 3.42A9.9 9.9 0 010 19.54a13.94 13.94 0 007.55 2.21c9.05 0 14-7.5 14-14 0-.21 0-.43-.02-.64a10 10 0 002.42-2.54z"/>
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="LinkedIn">
              <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-content-center">
          <h3>Company</h3>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        <div className="footer-content-right">
          <h3>Get In Touch</h3>
          <ul>
            <li className="contact-info-item">
              <span className="material-symbols-outlined contact-icon">location_on</span>
              <span>Connaught Place, New Delhi - 110001, India</span>
            </li>
            <li className="contact-info-item">
              <span className="material-symbols-outlined contact-icon">call</span>
              <span>+91 7007764009</span>
            </li>
            <li className="contact-info-item">
              <span className="material-symbols-outlined contact-icon">mail</span>
              <span>contactme@ujjawalgupta.online</span>
            </li>
          </ul>
        </div>
      </div>
      <hr className="footer-divider" />
      <p className="footer-copyright">Copyright 2026 © Tomato.com - All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;

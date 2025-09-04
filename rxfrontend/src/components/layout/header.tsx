'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pill, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Search Drugs', href: '/drugs' },    
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="header">
      <nav className="header-nav">
        <div className="header-container">
          {/* Logo */}
          <Link href="/" className="header-logo">
            <Pill className="header-logo-icon" />
            <span className="header-logo-text">RxView</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="header-nav-desktop">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`header-nav-link ${
                  isActiveRoute(item.href) ? 'header-nav-link-active' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="header-mobile-button-container">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="header-mobile-button"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="header-mobile-icon" />
              ) : (
                <Menu className="header-mobile-icon" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="header-mobile-menu">
            <div className="header-mobile-nav">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`header-mobile-nav-link ${
                    isActiveRoute(item.href) ? 'header-mobile-nav-link-active' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
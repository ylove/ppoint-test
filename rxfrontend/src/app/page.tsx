import Link from 'next/link';
import { Search, Shield, Zap, Users, ArrowRight, Pill } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RxView - AI-Enhanced Drug Information Platform',
  description: 'Access comprehensive prescription drug information with AI-powered insights. Search FDA-approved medications, view detailed prescribing information, and get simplified explanations.',
  openGraph: {
    title: 'RxView - AI-Enhanced Drug Information Platform',
    description: 'Access comprehensive prescription drug information with AI-powered insights.',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="hero-icon-wrapper">
              <div className="hero-icon-container">
                <Pill className="hero-icon" />
              </div>
            </div>
            
            <h1 className="hero-title">
              AI-Enhanced 
              <span className="hero-title-gradient">
                {' '}Drug Information
              </span>
            </h1>
            
            <p className="hero-description">
              Access comprehensive prescription drug information with AI-powered insights. 
              Search FDA-approved medications, view detailed prescribing information, and get 
              simplified explanations designed for healthcare professionals and patients.
            </p>

            {/* Quick Search */}
            <div className="quick-search-container">
              <div className="quick-search-card">
                <h3 className="quick-search-title">
                  Quick Drug Search
                </h3>
                <QuickSearchForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="features-header">
            <h2 className="features-title">
              Powerful Features for Healthcare Professionals
            </h2>
            <p className="features-description">
              Our platform combines comprehensive FDA drug data with advanced AI to deliver 
              unparalleled drug information accessibility and understanding.
            </p>
          </div>

          <div className="features-grid">
            <FeatureCard
              icon={<Search className="feature-icon" />}
              title="Advanced Search"
              description="Search through thousands of FDA-approved medications by brand name, generic name, or manufacturer."
            />
            
            <FeatureCard
              icon={<Zap className="feature-icon" />}
              title="AI-Enhanced Content"
              description="Get simplified explanations and patient-friendly summaries powered by advanced AI."
            />
            
            <FeatureCard
              icon={<Shield className="feature-icon" />}
              title="FDA-Accurate Data"
              description="All information sourced directly from official FDA drug labels and prescribing information."
            />
            
            <FeatureCard
              icon={<Users className="feature-icon" />}
              title="Healthcare Focused"
              description="Designed for healthcare professionals, pharmacists, and informed patients."
            />
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="cta-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="cta-title">
            Start Exploring Drug Information Today
          </h2>
          <p className="cta-description">
            Join healthcare professionals who trust RxView for accurate, comprehensive, 
            and AI-enhanced drug information.
          </p>
          <Link href="/drugs" className="cta-button">
            Get Started
            <ArrowRight className="btn-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon-wrapper">
        {icon}
      </div>
      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-description">{description}</p>
    </div>
  );
}

function QuickSearchForm() {
  return (
    <form action="/drugs" method="GET" className="quick-search-form">
      <div className="search-input-container">
        <input
          type="text"
          name="query"
          placeholder="Search for a drug (e.g., Lipitor, Metformin)..."
          className="search-input"
        />
      </div>
      <button type="submit" className="search-button">
        Search Drugs
      </button>
    </form>
  );
}

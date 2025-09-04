import Link from 'next/link';
import { AlertCircle, Home, Search } from 'lucide-react';

export default function DrugNotFound() {
  return (
    <div className="drug-not-found-page">
      <div className="drug-not-found-container">
        <div className="drug-not-found-content">
          <div className="drug-not-found-icon">
            <AlertCircle className="drug-not-found-icon-svg" />
          </div>
          <h1 className="drug-not-found-title">Drug Not Found</h1>
          <p className="drug-not-found-description">
            The requested drug information could not be found in our database. 
            This could be because the drug name or generic name was misspelled, 
            or the medication is not in our current dataset.
          </p>
        </div>
        
        <div className="drug-not-found-actions">
          <Link href="/drugs" className="drug-not-found-button drug-not-found-button-primary">
            <Search className="drug-not-found-button-icon" />
            Search for Drugs
          </Link>
          
          <Link href="/" className="drug-not-found-button drug-not-found-button-secondary">
            <Home className="drug-not-found-button-icon" />
            Go Home
          </Link>
        </div>
        
        <div className="drug-not-found-tip">
          <p className="drug-not-found-tip-text">
            <strong>Tip:</strong> Try searching by the brand name or generic name of the medication. 
            You can also browse our complete drug database using the search function.
          </p>
        </div>
      </div>
    </div>
  );
}
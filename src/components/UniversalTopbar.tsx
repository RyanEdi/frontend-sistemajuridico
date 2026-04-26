import React from 'react';
import { Link } from 'react-router-dom';
import './UniversalTopbar.css';

export type UniversalTopbarLink = {
  label: string;
  to: string;
};

export type UniversalTopbarAction = {
  label: string;
  to: string;
};

type UniversalTopbarProps = {
  brandTitle?: string;
  brandSubtitle?: string;
  links: UniversalTopbarLink[];
  activeLinkLabel?: string;
  secondaryAction?: UniversalTopbarAction;
  primaryAction?: UniversalTopbarAction;
};

const UniversalTopbar: React.FC<UniversalTopbarProps> = ({
  brandTitle = 'The Sovereign',
  brandSubtitle = 'Editorial Jurist',
  links,
  activeLinkLabel,
  secondaryAction,
  primaryAction,
}) => {
  return (
    <nav className="universal-topbar">
      <div className="universal-topbar-left">
        <Link className="universal-brand" to="/">
          <span className="universal-brand-title">{brandTitle}</span>
          <span className="universal-brand-subtitle">{brandSubtitle}</span>
        </Link>

        <div className="universal-topbar-links">
          {links.map(link => (
            <Link
              className={`universal-topbar-link${
                link.label === activeLinkLabel ? ' active' : ''
              }`}
              key={`${link.label}-${link.to}`}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="universal-topbar-actions">
        {secondaryAction && (
          <Link className="universal-btn-link" to={secondaryAction.to}>
            {secondaryAction.label}
          </Link>
        )}

        {primaryAction && (
          <Link className="universal-btn-primary" to={primaryAction.to}>
            {primaryAction.label}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default UniversalTopbar;

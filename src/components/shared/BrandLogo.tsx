import { Link } from 'react-router-dom';

type BrandLogoProps = {
  className?: string;
  titleClassName?: string;
  size?: 'sm' | 'md';
  subtitle?: string;
};

export function BrandLogo({ className = '', titleClassName = '', size = 'md', subtitle }: BrandLogoProps) {
  return (
    <Link to="/" className={`brand-logo ${size === 'sm' ? 'brand-logo-sm' : ''} ${className}`.trim()}>
      <span className="brand-logo-mark" aria-hidden="true">
        <span className="brand-logo-play" />
        <span className="brand-logo-dot" />
      </span>
      <span className="brand-logo-copy">
        <span className={`brand-logo-title ${titleClassName}`.trim()}>freeutils</span>
        {subtitle ? <span className="brand-logo-subtitle">{subtitle}</span> : null}
      </span>
    </Link>
  );
}

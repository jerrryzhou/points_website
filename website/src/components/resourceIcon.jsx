export default function ResourceIcon({ name, size = 24, ...props }) {
  const paths = {
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M2 9h20M6 15h4" />
      </>
    ),
    home: (
      <>
        <path d="m2 10 10-8 10 8M5 8v13h5v-7h4v7h5V8" />
      </>
    ),
    academic: (
      <>
        <path d="m1 9 11-6 11 6-11 6L1 9ZM5 12v6q7 6 14 0v-6M23 9v9" />
      </>
    ),
    folder: (
      <path d="M3 19V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2M3 19l3-9h16l-3 11H5a2 2 0 0 1-2-2Z" />
    ),
    document: (
      <>
        <path d="M5 2h9l5 5v15H5V2ZM14 2v6h5M9 12h6M9 16h6" />
      </>
    ),
    sheet: (
      <>
        <path d="M5 2h9l5 5v15H5V2ZM14 2v6h5" />
        <path d="M8 12h8v7H8zM8 15.5h8M12 12v7" />
      </>
    ),
    pdf: (
      <>
        <path d="M5 2h9l5 5v15H5V2ZM14 2v6h5" />
        <path d="M7 18c5-1 8-8 5-8-3 0 0 8 5 7" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5l8-3ZM12 7v6" />
        <path d="M12 17h.01" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M21 3 11 13" />
        <path d="M10 4H4v16h16v-6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="7.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: <path d="m9 5 7 7-7 7" />,
    back: <path d="m12 4-8 8 8 8M4 12h17" />,
    download: (
      <>
        <path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    refresh: (
      <>
        <path d="M20 7a9 9 0 1 0 1 8M20 2v6h-6" />
      </>
    ),
    sort: <path d="M12 20V4m-5 5 5-5 5 5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.document}
    </svg>
  );
}

export function ResourceSearch({ value, onChange, placeholder }) {
  return (
    <div className="mr-search">
      <ResourceIcon name="search" size={24} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
      />
    </div>
  );
}

export function ResourceExternal({ href, children, className = "", ...props }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

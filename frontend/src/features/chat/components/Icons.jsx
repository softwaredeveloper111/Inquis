const make = (children) =>
  function Icon({ size = 18, ...props }) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };

// Logo is a placeholder: swap it with your own asset later
const Icons = {
  Logo: make(<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />),
  Search: make(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
  ),
  PanelLeft: make(
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9 4v16" />
    </>,
  ),
  Plus: make(<path d="M12 5v14M5 12h14" />),
  Plug: make(<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7zM12 17v5" />),
  History: make(
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>,
  ),
  Chevron: make(<path d="m6 9 6 6 6-6" />),
  Dots: make(
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>,
  ),
  Pin: make(<path d="M12 17v5M9 3h6l-1 6 4 4v2H6v-2l4-4-1-6z" />),
  Edit: make(
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
  ),
  Trash: make(<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />),
  Copy: make(
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </>,
  ),
  Check: make(<path d="m5 12 5 5 9-10" />),
  Send: make(<path d="M12 19V5M5 12l7-7 7 7" />),
  Incognito: make(
    <>
      <path d="M3 11h18M5 11l2-6h10l2 6" />
      <circle cx="8" cy="16" r="2.5" />
      <circle cx="16" cy="16" r="2.5" />
      <path d="M10.5 16h3" />
    </>,
  ),
  Menu: make(<path d="M4 6h16M4 12h16M4 18h16" />),
  Moon: make(<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />),
  Sun: make(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
  ),
  Monitor: make(
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>,
  ),
  Logout: make(
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  ),
  User: make(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>,
  ),
};

export default Icons;

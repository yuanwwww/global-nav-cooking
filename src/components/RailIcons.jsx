/** Figma L2_alt — 20px Create / Delete icons (signal accent) */
export function IconEdit({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.3 3.7 16.3 7.7a1 1 0 0 1 0 1.4L8.5 17 4 18l1-4.5 7.8-7.8a1 1 0 0 1 1.4 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10.5 5.5 14.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Figma Error — 16px, Signal/Negative (tree + rail validation) */
export function IconErrorWarning({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z"
        stroke="currentColor"
        strokeWidth="1.33"
      />
      <path
        d="M8 4.75v4.5M8 11.25h.01"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTrash({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 7h8v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 7h12M8 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 10v5M11 10v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

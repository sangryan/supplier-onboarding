import React from 'react';

const DottedArrowIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line
      x1="2"
      y1="12"
      x2="14"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="2.5 2"
      strokeLinecap="round"
    />
    <polyline
      points="11,7 19,12 11,17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default DottedArrowIcon;

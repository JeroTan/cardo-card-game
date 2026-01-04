export default function ProgressCircle({
  percent = 0,
  strokeWidth = 20,
  color = "#007bff"
}: {
  percent?: number; // 0 to 1 range (0 = empty, 1 = full)
  strokeWidth?: number; // thickness of the donut
  color?: string; // color of the progress arc
}) {
  // SVG circle calculations (using 100 as base size for viewBox)
  const viewBoxSize = 100;
  const radius = (viewBoxSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent * circumference);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{ transform: 'rotate(-90deg)', display: 'block' }} // Start from top, rotate clockwise
    >
      {/* Progress circle (colored donut) */}
      <circle
        cx={viewBoxSize / 2}
        cy={viewBoxSize / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
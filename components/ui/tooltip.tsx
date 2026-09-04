export function Tooltip({ children, content }: { children: React.ReactElement; content: string }) {
  return <span title={content} className="inline-flex">{children}</span>;
}
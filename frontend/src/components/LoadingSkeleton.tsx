export function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="skeleton">
      <div className="skeleton__preview" />
      <div className="skeleton__meta">
        <div className="skeleton__line" />
      </div>
      <div className="skeleton__actions">
        <div className="skeleton__btn" />
        <div className="skeleton__btn" />
        <div className="skeleton__btn" />
      </div>
    </div>
  );
}

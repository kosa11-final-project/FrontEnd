export function Icon({ icon: Component, size = 18, ...props }) {
  return <Component size={size} weight="Outline" strokeWidth={1.7} {...props} />;
}

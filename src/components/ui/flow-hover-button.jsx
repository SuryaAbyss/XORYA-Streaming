import './flow-hover-button.css';

export const Button = ({ icon, children, className, ...props }) => (
  <button
    className={`flow-hover-btn ${className || ''}`}
    {...props}
  >
    {icon}
    <span>{children}</span>
  </button>
)

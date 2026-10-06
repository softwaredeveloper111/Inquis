import styles from "./SpinnerLoader.module.scss";

/**
 * Props:
 *  - size:       spinner ka size in px (default 24)
 *  - fullscreen: true -> poori screen ke center mein (position: fixed)
 *  - overlay:    true -> peeche halka overlay (sirf fullscreen ke saath)
 *  - className:  extra class agar chahiye
 *
 * fullscreen=false ho to parent ke andar center hoga
 * (parent ko height chahiye, e.g. height: 100vh ya flex: 1)
 */
export default function SpinnerLoader({
  size = 24,
  fullscreen = false,
  overlay = false,
  className = "",
}) {
  const wrapperClass = [
    styles.wrapper,
    fullscreen && styles.fullscreen,
    fullscreen && overlay && styles.overlay,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass} role="status" aria-label="Loading">
      <svg
        className={styles.spinner}
        width={size}
        height={size}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle className={styles.track} cx="25" cy="25" r="20" />
        <circle className={styles.arc} cx="25" cy="25" r="20" />
      </svg>
    </div>
  );
}






/** how to use it */
/**
 * 
 * // Poori page ke center mein
<SpinnerLoader fullscreen />

// Overlay ke saath (data load hote waqt)
<SpinnerLoader fullscreen overlay />

// Kisi container ke andar
<div style={{ height: 300 }}>
  <SpinnerLoader size={20} />
</div>
 * 
 */
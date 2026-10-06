// components/SkeletonLoader/SkeletonLoader.jsx

import styles from "./SkeletonLoader.module.scss";

export default function SkeletonLoader() {
  return (
    <div className={styles.skeleton}>
      <span />
      <span />
      <span />
    </div>
  );
}
import { Link } from "react-router-dom";
import styles from "./legal.module.scss";

export default function LegalPage({ title, updated, sections }) {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <Link to="/" className={styles.back}>← Back to app</Link>
        <h1>{title}</h1>
        <p className={styles.meta}>Last updated: {updated}</p>
        {sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p?.map((t) => <p key={t}>{t}</p>)}
            {s.list && <ul>{s.list.map((i) => <li key={i}>{i}</li>)}</ul>}
          </section>
        ))}
      </article>
    </main>
  );
}
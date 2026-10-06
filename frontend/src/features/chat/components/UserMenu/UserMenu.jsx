import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Icons from "../Icons";
import { user as demoUser } from "../../../../data/demo";
import styles from "./UserMenu.module.scss";
import { logout } from "../../../auth/redux/auth.thunk";

const THEMES = [
  { value: "light", label: "Light", Icon: Icons.Sun },
  { value: "dark", label: "Dark", Icon: Icons.Moon },
  { value: "system", label: "System", Icon: Icons.Monitor },
];

export default function UserMenu({ compact }) {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const authUser = useSelector((state) => {
  const u = state.auth.user;
  return u?.data ?? u?.user ?? u;
});

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

useEffect(() => {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}, [theme]);

  // "system" = remove data-theme so the prefers-color-scheme query takes over
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const close = () => { setOpen(false); setShowThemes(false); };
  const current = THEMES.find((t) => t.value === theme);

  const handleSignOut = async () => {
    close();
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <div className={styles.wrap}>
      <button className={`${styles.trigger} ${compact ? styles.compact : ""}`} onClick={() => setOpen((o) => !o)}>
        <span className={styles.avatar}><Icons.User size={14} /></span>
        <span className={styles.info}>
          <span className={styles.email}>{authUser?.email || authUser?.username || "Account"}</span>
          <span className={styles.plan}>{demoUser.plan}</span>
        </span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={close} />
          <div className={styles.popup}>
            <button className={styles.row} onClick={() => setShowThemes((s) => !s)}>
              <current.Icon size={16} />
              <span className={styles.grow}>Appearance</span>
              <span className={styles.value}>{current.label}</span>
              <Icons.Chevron size={16} className={showThemes ? styles.flip : ""} />
            </button>
            {showThemes && (
              <div className={styles.sub}>
                {THEMES.map(({ value, label, Icon }) => (
                  <button key={value} className={styles.row} onClick={() => setTheme(value)}>
                    <Icon size={16} />
                    <span className={styles.grow}>{label}</span>
                    {theme === value && <Icons.Check size={16} className={styles.check} />}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.divider} />
            <button className={styles.row} onClick={handleSignOut}>
              <Icons.Logout size={16} />
              <span className={styles.grow}>Sign out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

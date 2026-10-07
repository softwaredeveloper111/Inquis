import { useState, useEffect ,useRef } from "react";
import { NavLink } from "react-router-dom";
import Icons from "../Icons";
import UserMenu from "../UserMenu/UserMenu";
import styles from "./Sidebar.module.scss";
import SpinnerLoader from "../../../../components/SpinnerLoader";

export default function Sidebar({
  chats,
  activeId,
  chatsLoading,
  collapsed,
  mobileOpen,
  onNew,
  onSearch,
  onToggle,
  onNavigate,
  onOpenChat,
  onPin,
  onRename,
  onDelete,
  hasMore, 
  loadingMore,
   onLoadMore
}) {
  const [menu, setMenu] = useState(null); // { id, top, left }

 const sentinelRef = useRef(null);

  const getTheme = () =>
    document.documentElement.getAttribute("data-theme") || "light";
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

 // list ke end tak pahunchte hi agla batch
  useEffect(() => {
  const el = sentinelRef.current;
  if (!el || !hasMore) return;
  const io = new IntersectionObserver(([e]) => e.isIntersecting && onLoadMore());
  io.observe(el);
  return () => io.disconnect();
   }, [hasMore, chats.length, onLoadMore]);

  const pinned = chats.filter((c) => c.pinned);
  const rest = chats.filter((c) => !c.pinned);
  const menuChat = menu && chats.find((c) => c.id === menu.id);

  const openMenu = (e, id) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      id,
      top: Math.min(r.bottom + 4, window.innerHeight - 140),
      left: Math.min(r.left, window.innerWidth - 172),
    });
  };
  const close = () => setMenu(null);

  const renderItem = (c) => (
    <div
      key={c.id}
      className={`${styles.item} ${c.id === activeId ? styles.active : ""} ${menu?.id === c.id ? styles.menuOpen : ""}`}
    >
      <button
        className={styles.itemTitle}
        onClick={() => onOpenChat(c.id)}
        title={c.title}
      >
        {c.title}
      </button>
      <button
        className={styles.dots}
        aria-label="Chat options"
        onClick={(e) => openMenu(e, c.id)}
      >
        <Icons.Dots size={16} />
      </button>
    </div>
  );

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.open : ""}`}
    >
      <div className={styles.header}>
        <button
          className={styles.logoBtn}
          onClick={collapsed ? onToggle : undefined}
          aria-label="Home"
        >
          <span className={styles.brandName}>Inquis</span>
          <span className={styles.brandMark}>I</span>
        </button>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtn}
            onClick={onSearch}
            aria-label="Search"
          >
            <Icons.Search />
          </button>
          <button
            className={styles.iconBtn}
            onClick={onToggle}
            aria-label="Collapse sidebar"
          >
            <Icons.PanelLeft />
          </button>
        </div>
      </div>

      <nav className={styles.nav}>
        <button className={styles.navItem} onClick={onNew}>
          <Icons.Plus />
          <span className={styles.label}>New</span>
        </button>
        <NavLink
          to="/connectors"
          onClick={onNavigate}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navActive : ""}`
          }
        >
          <Icons.Plug />
          <span className={styles.label}>Connectors</span>
        </NavLink>
        <button
          className={`${styles.navItem} ${styles.railOnly}`}
          onClick={onSearch}
          aria-label="Search"
        >
          <Icons.Search />
        </button>
        <button
          className={`${styles.navItem} ${styles.railOnly}`}
          onClick={onToggle}
          aria-label="Show history"
        >
          <Icons.History />
        </button>
      </nav>

      <div className={styles.chatArea}>
        {chatsLoading ? (
          <div className={styles.loader}>
            <SpinnerLoader size={20} />
          </div>
        ) : (
          <div className={styles.list}>
            {pinned.length > 0 && (
              <>
                <div className={styles.sectionLabel}>Pinned</div>
                {pinned.map(renderItem)}
              </>
            )}

            <div className={styles.sectionLabel}>Sessions</div>

            {rest.map(renderItem)}
            {hasMore && (
  <div ref={sentinelRef} style={{ minHeight: 24 }}>
    {loadingMore && <SpinnerLoader size={16} />}
  </div>
)}
          </div>
        )}
      </div>
      {!collapsed && <div className={styles.spacer} />}

      <div className={styles.footer}>
        <UserMenu compact={collapsed} />
      </div>

      {menu && menuChat && (
        <>
          <div className={styles.backdrop} onClick={close} />
          <div
            className={styles.menu}
            style={{ top: menu.top, left: menu.left }}
          >
            <button
              onClick={() => {
                onPin(menu.id);
                close();
              }}
            >
              <Icons.Pin size={16} />
              {menuChat.pinned ? "Unpin" : "Pin"}
            </button>

            <button
              onClick={() => {
                onRename(menuChat);
                close();
              }}
            >
              <Icons.Edit size={16} />
              Rename
            </button>
            <button
              className={styles.danger}
              onClick={() => {
                onDelete(menu.id);
                close();
              }}
            >
              <Icons.Trash size={16} />
              Delete
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

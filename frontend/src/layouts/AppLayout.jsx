import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import RenameModal from "../features/chat/components/RenameModal/RenameModal";

import Sidebar from "../features/chat/components/Sidebar/Sidebar";
import TopBar from "../features/chat/components/TopBar/TopBar";
import UpgradeModal from "../features/chat/components/UpgradeModal/UpgradeModal";
import SearchModal from "../features/chat/components/SearchModal/SearchModal";

import useChat from "../features/chat/hooks/useChat";

import ConnectorActionCards from "../features/connectors/components/Connectoractioncards";

import styles from "./AppLayout.module.scss";






export default function AppLayout() {
  const navigate = useNavigate();

  const {
    chats,
    activeChatId,
    streaming,
    selectChat,
    loadChats,
    chatsLoading,
    deleteChat,
    pinChat,
    renameChat,
    chatsHasMore,
    chatsLoadingMore,
    loadMoreChats
  } = useChat();

  const [renameTarget, setRenameTarget] = useState(null);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [incognito, setIncognito] = useState(false);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const openChat = (id) => {
    if (streaming) return;
    selectChat(id);
    setSearchOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const handleNewChat = () => {
    if (streaming) return;
    selectChat(null);
    setSearchOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const toggleSidebar = () =>
    window.innerWidth <= 768 ? setMobileOpen(false) : setCollapsed((v) => !v);

  return (
    <div className={styles.app}>

     <ConnectorActionCards />

      <Sidebar
        chats={chats}
        chatsLoading={chatsLoading}
        activeId={activeChatId}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNew={handleNewChat}
        onSearch={() => {
          setSearchOpen(true);
          setMobileOpen(false);
        }}
        onToggle={toggleSidebar}
        onNavigate={() => setMobileOpen(false)}
        onOpenChat={openChat}
        onPin={pinChat}
        onRename={setRenameTarget}
        onDelete={deleteChat}
        hasMore={chatsHasMore}
        loadingMore={chatsLoadingMore}
       onLoadMore={loadMoreChats}
      />

      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      <div className={styles.main}>
        <TopBar
          onMenu={() => setMobileOpen(true)}
          onUpgrade={() => setUpgradeOpen(true)}
          incognito={incognito}
          onIncognito={() => setIncognito((v) => !v)}
        />

        <div className={styles.content}>
          <Outlet
            context={{
              activeId: activeChatId,
            }}
          />
        </div>
      </div>

      {searchOpen && (
        <SearchModal
          chats={chats}
          onSelect={openChat}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}

      {renameTarget && (
        <RenameModal
          title={renameTarget.title}
          onSave={async (title) => {
            if (await renameChat(renameTarget.id, title)) setRenameTarget(null);
          }}
          onClose={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}

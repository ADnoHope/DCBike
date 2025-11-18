// Simple chat widget logic with polling
(function(){
  const API_BASE = '/api/chat';
  const POLL_INTERVAL = 4000; // ms
  let conversations = [];
  let activeConversationId = null;
  let lastMessageId = null;
  let pollTimer = null;

  function getToken(){ return localStorage.getItem('token'); }
  function authHeaders(){ return { 'Authorization': 'Bearer ' + getToken(), 'Content-Type': 'application/json' }; }

  function init(){
    if(!getToken()) return; // Only show when logged in
    buildUI();
    loadConversations();
    // Poll for new messages/unread count every 10 seconds
    setInterval(() => {
      if(!document.getElementById('chatPanel').classList.contains('d-none') && !activeConversationId) {
        // If panel is open and showing conversation list, refresh
        loadConversations();
      } else if(document.getElementById('chatPanel').classList.contains('d-none')) {
        // If panel is closed, still check for unread to update badge
        loadConversations();
      }
    }, 10000);
  }

  function buildUI(){
    const container = document.createElement('div');
    container.id = 'chat-widget';
      container.innerHTML = `
      <div class="chat-toggle" id="chatToggle">
        <i class="fas fa-comments"></i>
        <span class="chat-badge" id="chatBadge"></span>
      </div>
      <div class="chat-panel d-none" id="chatPanel">
        <div class="chat-header">
            <span id="chatHeaderTitle">Chat</span>
            <div class="chat-actions">
              <button id="backToListBtnHeader" class="back-to-list-header" title="Quay lại"><i class="fas fa-arrow-left"></i></button>
              <button id="chatCloseBtn" title="Đóng">&times;</button>
            </div>
          </div>
        <div class="chat-body">
          <div class="chat-conversation-list" id="chatConversationList"></div>
          <div class="chat-messages d-none" id="chatMessagesWrapper">
            <div class="messages" id="chatMessages"></div>
          </div>
        </div>
        <div class="chat-footer d-none" id="chatFooter">
          <form id="chatSendForm" class="chat-send-form">
            <input type="text" id="chatInput" placeholder="Nhập tin nhắn..." autocomplete="off" />
            <button type="submit" title="Gửi"><i class="fas fa-paper-plane"></i></button>
          </form>
          <button class="back-to-list" id="backToListBtn">← Cuộc trò chuyện</button>
        </div>
      </div>`;
    document.body.appendChild(container);

    document.getElementById('chatToggle').onclick = () => {
      const panel = document.getElementById('chatPanel');
      const toggle = document.getElementById('chatToggle');
      
      if (panel.classList.contains('d-none')) {
        // Opening - hide toggle immediately, then animate panel
        toggle.classList.add('hidden');
        setTimeout(() => {
          toggle.classList.add('active');
          setTimeout(() => toggle.classList.remove('active'), 400);
        }, 10);
        
        panel.classList.remove('d-none', 'chat-closing');
        panel.classList.add('chat-opening');
      } else {
        // Closing - animate panel first, then show toggle
        panel.classList.remove('chat-opening');
        panel.classList.add('chat-closing');
        setTimeout(() => {
          panel.classList.add('d-none');
          panel.classList.remove('chat-closing');
          // show toggle after panel is hidden
          toggle.classList.remove('hidden');
        }, 250);
      }
    };
    document.getElementById('chatCloseBtn').onclick = () => {
      const panel = document.getElementById('chatPanel');
      const toggle = document.getElementById('chatToggle');
      panel.classList.remove('chat-opening');
      panel.classList.add('chat-closing');
      setTimeout(() => {
        panel.classList.add('d-none');
        panel.classList.remove('chat-closing');
        // show toggle when panel closes
        toggle.classList.remove('hidden');
      }, 250);
    };

    // Back button in header (visible when in a conversation)
    const backHeader = document.getElementById('backToListBtnHeader');
    if (backHeader) {
      backHeader.style.display = 'none';
      backHeader.onclick = () => {
        activeConversationId = null; lastMessageId = null;
        document.getElementById('chatMessagesWrapper').classList.add('d-none');
        document.getElementById('chatConversationList').classList.remove('d-none');
        // Reset header title to "Chat"
        const headerTitle = document.getElementById('chatHeaderTitle');
        if (headerTitle) headerTitle.textContent = 'Chat';
        // hide footer input
        const footer = document.getElementById('chatFooter'); if (footer) footer.classList.add('d-none');
        stopPolling();
        try {
          // hide header back and show bottom back button
          backHeader.style.display = 'none';
          const backBottomEl = document.getElementById('backToListBtn');
          if (backBottomEl) backBottomEl.style.display = '';
        } catch (e) { console.debug('Could not toggle back button visibility after returning to list', e); }
      };
    }

    // existing backToList button kept for layout compatibility; wire it to same handler
    const backBtn = document.getElementById('backToListBtn');
    if (backBtn) {
      backBtn.onclick = () => {
        // reuse header back button logic
        if (backHeader) backHeader.onclick();
      };
    }

    // attach send handler (chatSendForm may be outside messages)
    const sendForm = document.getElementById('chatSendForm');
    if (sendForm) sendForm.addEventListener('submit', sendMessage);
  }

  async function loadConversations(){
    try {
      const res = await fetch(API_BASE + '/conversations', { headers: authHeaders() });
      const data = await res.json();
      if(!data.success) return;
      conversations = data.data || [];
      console.log('Loaded conversations:', conversations.length, conversations);
      renderConversationList();
      updateUnreadBadge();
    } catch(e){ console.error('loadConversations error', e); }
  }

  function updateUnreadBadge(){
    const badge = document.getElementById('chatBadge');
    if(!badge) return;
    
    // Sum all unread messages across all conversations
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
    
    if(totalUnread > 0) {
      badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderConversationList(){
    const listEl = document.getElementById('chatConversationList');
    if(!listEl) return;
    if(!conversations.length){ listEl.innerHTML = '<p class="empty">Không có cuộc trò chuyện.</p>'; return; }
    
    // Get current user data to determine which name to show
    const currentUser = getUserData();
    const isDriver = currentUser && currentUser.loai_tai_khoan === 'tai_xe';
    
    listEl.innerHTML = conversations.map(c => {
      // Show the other person's name only
      const displayName = isDriver ? (c.ten_khach_hang || 'Khách hàng') : (c.ten_tai_xe || 'Tài xế');
      const timeAgo = getTimeAgo(c.updated_at || c.created_at);
      
      return `
      <div class="chat-conversation-item" data-id="${c.id}">
        <div>
          <div class="title">${displayName}</div>
          <div class="time-ago">${timeAgo}</div>
        </div>
        <div class="meta">
          ${c.unread ? `<span class="badge">${c.unread}</span>` : ''}
        </div>
      </div>`;
    }).join('');
    listEl.querySelectorAll('.chat-conversation-item').forEach(item => {
      item.onclick = () => openConversation(item.getAttribute('data-id'));
    });
  }

  function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return past.toLocaleDateString('vi-VN');
  }

  async function openConversation(id){
    activeConversationId = id;
    document.getElementById('chatConversationList').classList.add('d-none');
    document.getElementById('chatMessagesWrapper').classList.remove('d-none');
    document.getElementById('chatMessages').innerHTML = '<p class="loading">Đang tải...</p>';
    
    // Find conversation and update header title with user name
    const convo = conversations.find(c => c.id == id);
    const headerTitle = document.getElementById('chatHeaderTitle');
    if (convo && headerTitle) {
      // Determine the other user's name based on current user's role
      const currentUser = getUserData();
      let otherUserName = 'Chat';
      
      if (currentUser && currentUser.loai_tai_khoan === 'tai_xe') {
        // If current user is driver, show customer name
        otherUserName = convo.ten_khach_hang || 'Khách hàng';
      } else {
        // If current user is customer, show driver name
        otherUserName = convo.ten_tai_xe || 'Tài xế';
      }
      
      headerTitle.textContent = otherUserName;
    }
    
    // Show header back button and hide bottom back button for a cleaner header action
    try {
      const backHeaderEl = document.getElementById('backToListBtnHeader');
      const backBottomEl = document.getElementById('backToListBtn');
      if (backHeaderEl) backHeaderEl.style.display = '';
      if (backBottomEl) backBottomEl.style.display = 'none';
      // show footer input
      const footer = document.getElementById('chatFooter'); if (footer) footer.classList.remove('d-none');
    } catch (e) { console.debug('Could not toggle back button visibility', e); }

    await loadMessages();
    startPolling();
  }

  async function loadMessages(){
    if(!activeConversationId) return;
    try {
      const url = API_BASE + '/messages/' + activeConversationId + (lastMessageId ? ('?after=' + lastMessageId) : '');
      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if(!data.success) return;
      const messages = data.data || [];
      appendMessages(messages);
    } catch(e){ console.error('loadMessages error', e); }
  }

  function appendMessages(messages){
    const box = document.getElementById('chatMessages');
    if(!box) return;
    if(lastMessageId == null) box.innerHTML='';
    messages.forEach(m => {
      lastMessageId = Math.max(lastMessageId || 0, m.id);
      const div = document.createElement('div');
      // Normalize types to number to avoid string/undefined mismatches
      const currentUserId = Number(getUserId());
      const senderId = Number(m.nguoi_gui_id);
      const isOwn = (!isNaN(currentUserId) && !isNaN(senderId) && senderId === currentUserId);
      // debug to help diagnose incorrect side rendering
      try { console.debug('chat: append message', { id: m.id, senderId, currentUserId, isOwn }); } catch (e) {}
      div.className = 'msg' + (isOwn ? ' own' : '');
      div.setAttribute('data-sender', String(m.nguoi_gui_id));
      
      // Format time
      const time = formatMessageTime(m.created_at);
      
      // Add read status for own messages
      let statusIcon = '';
      if (isOwn) {
        if (m.da_doc) {
          statusIcon = '<span class="msg-status seen" title="Đã xem"><i class="fas fa-check-double"></i></span>';
        } else {
          statusIcon = '<span class="msg-status sent" title="Đã gửi"><i class="fas fa-check"></i></span>';
        }
      }
      
      div.innerHTML = `
        <div class="bubble">
          <div class="msg-content">${escapeHtml(m.noi_dung)}</div>
          <div class="msg-footer">
            <span class="msg-time">${time}</span>
            ${statusIcon}
          </div>
        </div>`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  }

  function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function getUserId(){
    try { const raw = localStorage.getItem('user'); if(!raw) return null; return JSON.parse(raw).id; } catch(e){ return null; }
  }

  function getUserData(){
    try { const raw = localStorage.getItem('user'); if(!raw) return null; return JSON.parse(raw); } catch(e){ return null; }
  }

  async function sendMessage(e){
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text || !activeConversationId) return;
    try {
      await fetch(API_BASE + '/send/' + activeConversationId, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: text })
      });
      input.value='';
      await loadMessages();
    } catch(err){ console.error('sendMessage error', err); }
  }

  function startPolling(){
    stopPolling();
    pollTimer = setInterval(loadMessages, POLL_INTERVAL);
  }
  function stopPolling(){ if(pollTimer) clearInterval(pollTimer); pollTimer = null; }

  function escapeHtml(str){
    return str.replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[s]));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // If script is injected after DOM is ready, initialize immediately
    setTimeout(init, 0);
  }
})();
